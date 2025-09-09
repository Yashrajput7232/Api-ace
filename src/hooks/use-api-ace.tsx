"use client";

import type { Collection, ApiRequest, RequestTab, ApiResponse, HttpMethod, Auth, User } from '@/types';
import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useToast } from './use-toast';

// --- STATE AND REDUCER ---

interface AppState {
  collections: Collection[];
  activeTabs: RequestTab[];
  activeTabId: string | null;
  user: Omit<User, 'password'> | null;
  isInitialized: boolean;
}

type Action =
  | { type: 'SET_INITIAL_STATE'; payload: Pick<AppState, 'collections' | 'activeTabs' | 'activeTabId'> }
  | { type: 'SET_USER'; payload: AppState['user'] }
  | { type: 'SET_CLOUD_COLLECTIONS'; payload: Collection[] }
  | { type: 'ADD_COLLECTION'; payload: Collection }
  | { type: 'DELETE_COLLECTION'; payload: string }
  | { type: 'UPDATE_COLLECTION'; payload: Collection }
  | { type: 'CREATE_REQUEST'; payload: { collectionId: string; request: ApiRequest } }
  | { type: 'DELETE_REQUEST'; payload: { collectionId: string; requestId: string } }
  | { type: 'IMPORT_COLLECTIONS'; payload: Collection[] }
  | { type: 'OPEN_TAB'; payload: ApiRequest }
  | { type: 'CLOSE_TAB'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'UPDATE_ACTIVE_TAB'; payload: Partial<RequestTab> }
  | { type: 'SAVE_ACTIVE_TAB' }
  | { type: 'REQUEST_START'; payload: string }
  | { type: 'REQUEST_COMPLETE'; payload: { tabId: string; response?: ApiResponse } };

const initialState: AppState = {
  collections: [],
  activeTabs: [],
  activeTabId: null,
  user: null,
  isInitialized: false,
};

// Helper to add default auth to legacy requests
const addDefaultAuth = (request: Partial<ApiRequest>): ApiRequest => {
    const baseRequest = {
        id: '',
        name: '',
        url: '',
        method: 'GET' as HttpMethod,
        headers: [],
        params: [],
        body: '',
        collectionId: '',
        ...request,
    };
    if (!baseRequest.auth) {
        baseRequest.auth = { type: 'no-auth' };
    }
    return baseRequest as ApiRequest;
}


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
        const collectionsWithAuth = action.payload.collections.map(c => ({
            ...c,
            requests: c.requests.map(r => addDefaultAuth(r))
        }));
        const tabsWithAuth = action.payload.activeTabs.map(t => addDefaultAuth(t) as RequestTab);

        return { ...state, ...action.payload, collections: collectionsWithAuth, activeTabs: tabsWithAuth, isInitialized: true };

    case 'SET_USER':
        return { ...state, user: action.payload };
    
    case 'SET_CLOUD_COLLECTIONS':
        // Merge local and cloud collections, cloud takes precedence
        const localCollections = state.collections.filter(c => !c.userId);
        const cloudCollections = action.payload;
        const allCollections = [...localCollections, ...cloudCollections];
        return { ...state, collections: allCollections };

    case 'ADD_COLLECTION':
      return { ...state, collections: [...state.collections, action.payload] };
    
    case 'DELETE_COLLECTION':
      return { ...state, collections: state.collections.filter(c => c.id !== action.payload)};

    case 'UPDATE_COLLECTION':
      return {
        ...state,
        collections: state.collections.map(c => c.id === action.payload.id ? action.payload : c)
      };

    case 'CREATE_REQUEST':
        return {
            ...state,
            collections: state.collections.map(c => 
                c.id === action.payload.collectionId 
                ? { ...c, requests: [...c.requests, action.payload.request] }
                : c
            )
        };
    
    case 'DELETE_REQUEST':
        return {
            ...state,
            collections: state.collections.map(c => 
                c.id === action.payload.collectionId
                ? { ...c, requests: c.requests.filter(r => r.id !== action.payload.requestId) }
                : c
            )
        };

    case 'IMPORT_COLLECTIONS':
      const newCollections = action.payload.filter(
        (newC) => !state.collections.some((existingC) => existingC.id === newC.id)
      ).map(c => ({...c, requests: c.requests.map(r => addDefaultAuth(r))}));
      
      return { ...state, collections: [...state.collections, ...newCollections] };

    case 'OPEN_TAB': {
      const existingTab = state.activeTabs.find(tab => tab.id === action.payload.id);
      if (existingTab) {
        return { ...state, activeTabId: existingTab.id };
      }
      const requestWithAuth = addDefaultAuth(action.payload);
      const newTab: RequestTab = { ...requestWithAuth, loading: false, isDirty: false };
      return {
        ...state,
        activeTabs: [...state.activeTabs, newTab],
        activeTabId: newTab.id,
      };
    }

    case 'CLOSE_TAB': {
      const tabIndex = state.activeTabs.findIndex(tab => tab.id === action.payload);
      if (tabIndex === -1) return state;

      const newTabs = state.activeTabs.filter(tab => tab.id !== action.payload);
      let newActiveTabId = state.activeTabId;

      if (state.activeTabId === action.payload) {
        if (newTabs.length > 0) {
          newActiveTabId = newTabs[tabIndex] ? newTabs[tabIndex].id : newTabs[tabIndex - 1].id;
        } else {
          newActiveTabId = null;
        }
      }
      return { ...state, activeTabs: newTabs, activeTabId: newActiveTabId };
    }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabId: action.payload };

    case 'UPDATE_ACTIVE_TAB': {
      if (!state.activeTabId) return state;
      return {
        ...state,
        activeTabs: state.activeTabs.map(tab =>
          tab.id === state.activeTabId ? { ...tab, ...action.payload, isDirty: true } : tab
        ),
      };
    }
    
    case 'SAVE_ACTIVE_TAB': {
      if (!state.activeTabId) return state;
      const activeTab = state.activeTabs.find(t => t.id === state.activeTabId);
      if (!activeTab) return state;

      const updatedCollections = state.collections.map(collection => {
        if (collection.id === activeTab.collectionId) {
          const requestExists = collection.requests.some(r => r.id === activeTab.id);
          const requestToSave = addDefaultAuth(activeTab);
          const updatedRequests = requestExists
            ? collection.requests.map(r => r.id === activeTab.id ? { ...requestToSave, isDirty: false } : r)
            : [...collection.requests, { ...requestToSave, isDirty: false }];
          return { ...collection, requests: updatedRequests };
        }
        return collection;
      });

      return {
        ...state,
        collections: updatedCollections,
        activeTabs: state.activeTabs.map(tab => 
          tab.id === state.activeTabId ? { ...tab, isDirty: false } : tab
        )
      };
    }

    case 'REQUEST_START':
      return {
        ...state,
        activeTabs: state.activeTabs.map(tab =>
          tab.id === action.payload ? { ...tab, loading: true, response: undefined } : tab
        ),
      };

    case 'REQUEST_COMPLETE':
      return {
        ...state,
        activeTabs: state.activeTabs.map(tab =>
          tab.id === action.payload.tabId ? { ...tab, loading: false, response: action.payload.response } : tab
        ),
      };

    default:
      return state;
  }
};

// --- CONTEXT AND PROVIDER ---

interface ApiAceContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  createCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  updateCollection: (collection: Collection) => void;
  importCollections: (file: File) => void;
  exportCollection: (collectionId: string) => void;
  openRequestInTab: (request: ApiRequest) => void;
  sendRequest: (tabId: string) => Promise<void>;
  cancelRequest: (tabId: string) => void;
  createRequest: (collectionId: string, name: string) => void;
  deleteRequest: (collectionId: string, requestId: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const ApiAceContext = createContext<ApiAceContextType | undefined>(undefined);

export const ApiAceProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { toast } = useToast();
  const abortControllers = useRef(new Map<string, AbortController>());

  const syncToCloud = useCallback(async (collection: Collection) => {
    if (!state.user) return; // Don't sync if not logged in
    try {
        await fetch('/api/collections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(collection),
        });
    } catch (error) {
        console.error("Failed to sync collection to cloud:", error);
        toast({ variant: 'destructive', title: 'Sync Failed', description: 'Could not save collection to the cloud.'});
    }
  }, [state.user, toast]);

  // Load local state on mount
  useEffect(() => {
    try {
      const storedState = localStorage.getItem('apiAceState');
      if (storedState) {
        dispatch({ type: 'SET_INITIAL_STATE', payload: JSON.parse(storedState) });
      } else {
        dispatch({ type: 'SET_INITIAL_STATE', payload: { collections: [], activeTabs: [], activeTabId: null } });
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  // Persist state to local storage and sync to cloud
  useEffect(() => {
    if (!state.isInitialized) return;
    try {
      const stateToStore = {
          collections: state.collections.filter(c => !c.userId), // Only store local collections
          activeTabs: state.activeTabs.map(({ ...tab }) => tab),
          activeTabId: state.activeTabId,
      };
      localStorage.setItem('apiAceState', JSON.stringify(stateToStore));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [state.collections, state.activeTabs, state.activeTabId, state.isInitialized]);

  const findRequestById = useCallback((requestId: string): (ApiRequest | undefined) => {
    for (const collection of state.collections) {
        const found = collection.requests.find(r => r.id === requestId);
        if (found) return found;
    }
    for (const tab of state.activeTabs) {
        if (tab.id === requestId) return tab;
    }
    return undefined;
  }, [state.collections, state.activeTabs]);
  
  const openRequestInTab = useCallback((requestToOpen: ApiRequest) => {
    dispatch({ type: 'OPEN_TAB', payload: requestToOpen });
  }, []);

  const createCollection = useCallback(async (name: string) => {
    const tempId = `temp_${Date.now()}`;
    const newCollection: Partial<Collection> = { 
        id: tempId, 
        name, 
        requests: [],
    };
    if (state.user) {
        newCollection.userId = state.user.id as any; 
    }
    dispatch({ type: 'ADD_COLLECTION', payload: newCollection as Collection });
    
    if (state.user) {
        try {
            const response = await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }), // Send only name, backend generates ID
            });
            const { collectionId } = await response.json();
            
            // Update temp collection with real ID from backend
            dispatch({ type: 'DELETE_COLLECTION', payload: tempId });
            dispatch({ 
                type: 'ADD_COLLECTION', 
                payload: { ...newCollection, id: collectionId } as Collection 
            });
            toast({ title: "Collection created", description: `"${name}" has been created and saved to the cloud.` });

        } catch(e) {
             toast({ variant: "destructive", title: "Failed to create collection"});
        }
    } else {
        toast({ title: "Collection created", description: `"${name}" has been created locally.` });
    }
  }, [toast, state.user]);
  
  const deleteCollection = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_COLLECTION', payload: id });
    toast({ title: "Collection deleted" });
    // Also delete from cloud if it's a cloud collection
  }, [toast]);

  const updateCollection = useCallback((collection: Collection) => {
    dispatch({ type: 'UPDATE_COLLECTION', payload: collection });
    if(collection.userId) {
        syncToCloud(collection);
    }
  }, [syncToCloud]);
  
  const createRequest = useCallback((collectionId: string, name: string) => {
    const collection = state.collections.find(c => c.id === collectionId);
    if (!collection) return;

    const newRequest: ApiRequest = {
      id: crypto.randomUUID(),
      collectionId,
      name,
      method: 'GET',
      url: '',
      body: '',
      auth: { type: 'no-auth' },
      headers: [],
      params: []
    };
    
    const updatedCollection = {
        ...collection,
        requests: [...collection.requests, newRequest]
    }
    dispatch({type: 'UPDATE_COLLECTION', payload: updatedCollection});
    if(updatedCollection.userId) {
        syncToCloud(updatedCollection);
    }
    openRequestInTab(newRequest);

  }, [state.collections, openRequestInTab, syncToCloud]);
  
  const deleteRequest = useCallback((collectionId: string, requestId: string) => {
    const collection = state.collections.find(c => c.id === collectionId);
    if (!collection) return;

    const updatedCollection = {
        ...collection,
        requests: collection.requests.filter(r => r.id !== requestId)
    }

    dispatch({type: 'UPDATE_COLLECTION', payload: updatedCollection});
    if(updatedCollection.userId) {
        syncToCloud(updatedCollection);
    }

    dispatch({type: 'CLOSE_TAB', payload: requestId});
    toast({title: 'Request deleted'})
  }, [toast, state.collections, syncToCloud]);

  const importCollections = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') throw new Error("Invalid file content");
        const imported = JSON.parse(content);
        
        const collectionsToImport: Collection[] = Array.isArray(imported) ? imported : [imported];
        
        collectionsToImport.forEach(c => {
          if (!c.id || !c.name || !Array.isArray(c.requests)) {
            throw new Error("Invalid collection format");
          }
        });

        dispatch({ type: 'IMPORT_COLLECTIONS', payload: collectionsToImport });
        toast({
          title: "Import Successful",
          description: `${collectionsToImport.length} collection(s) imported locally.`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: error instanceof Error ? error.message : "Could not parse the file.",
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  const exportCollection = useCallback((collectionId: string) => {
    const collection = state.collections.find(c => c.id === collectionId);
    if (!collection) {
      toast({ variant: "destructive", title: "Export Failed", description: "Collection not found." });
      return;
    }
    const dataStr = JSON.stringify(collection, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${collection.name.replace(/\s/g, '_')}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [state.collections, toast]);

  const cancelRequest = useCallback((tabId: string) => {
    const controller = abortControllers.current.get(tabId);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(tabId);
    }
  }, []);

  const sendRequest = useCallback(async (tabId: string) => {
    const tab = state.activeTabs.find(t => t.id === tabId);
    if (!tab) return;
    
    const controller = new AbortController();
    abortControllers.current.set(tabId, controller);
    
    dispatch({ type: 'REQUEST_START', payload: tabId });

    const startTime = Date.now();
    try {
      const url = new URL(tab.url);
      const params = new URLSearchParams(url.search);
      
      tab.params.forEach(param => {
        if (param.enabled && param.key) {
          params.append(param.key, param.value);
        }
      });

       if (tab.auth.type === 'api-key' && tab.auth.apiKey?.in === 'query') {
        params.append(tab.auth.apiKey.key, tab.auth.apiKey.value);
      }
      url.search = params.toString();

      const headers = new Headers();
      tab.headers.forEach(header => {
        if (header.enabled && header.key) {
          headers.append(header.key, header.value);
        }
      });

      if (tab.auth.type === 'api-key' && tab.auth.apiKey?.in === 'header') {
        headers.append(tab.auth.apiKey.key, tab.auth.apiKey.value);
      } else if (tab.auth.type === 'bearer' && tab.auth.bearer?.token) {
        headers.append('Authorization', `Bearer ${tab.auth.bearer.token}`);
      } else if (tab.auth.type === 'basic' && tab.auth.basic?.username) {
        const encoded = btoa(`${tab.auth.basic.username}:${tab.auth.basic.password}`);
        headers.append('Authorization', `Basic ${encoded}`);
      }

      const hasBody = tab.method !== 'GET' && tab.method !== 'HEAD' && tab.body;
      if(hasBody) {
        if(!headers.has('Content-Type')) {
            headers.append('Content-Type', 'application/json');
        }
      }

      const response = await fetch(url.toString(), {
        method: tab.method,
        headers,
        body: hasBody ? tab.body : undefined,
        signal: controller.signal
      });

      const endTime = Date.now();
      const responseText = await response.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const apiResponse: ApiResponse = {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: responseHeaders,
        time: endTime - startTime,
        size: new Blob([responseText]).size,
      };

      dispatch({ type: 'REQUEST_COMPLETE', payload: { tabId, response: apiResponse } });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const apiResponse: ApiResponse = {
            status: 0,
            statusText: 'Cancelled',
            data: { message: 'Request was cancelled by the user.' },
            headers: {},
            time: Date.now() - startTime,
            size: 0,
        };
        dispatch({ type: 'REQUEST_COMPLETE', payload: { tabId, response: apiResponse } });
        return;
      }
      const apiResponse: ApiResponse = {
        status: 0,
        statusText: 'Fetch Error',
        data: {
          message: error instanceof Error ? error.message : "An unknown error occurred.",
          hint: "This could be a CORS issue. Check the browser console (F12) for more details. The API server must send the 'Access-Control-Allow-Origin' header.",
        },
        headers: {},
        time: Date.now() - startTime,
        size: 0,
      };
      dispatch({ type: 'REQUEST_COMPLETE', payload: { tabId, response: apiResponse } });
    } finally {
        abortControllers.current.delete(tabId);
    }
  }, [state.activeTabs]);

  const fetchCloudCollections = useCallback(async () => {
    try {
        const response = await fetch('/api/collections');
        if (response.ok) {
            const cloudCollections = await response.json();
            dispatch({ type: 'SET_CLOUD_COLLECTIONS', payload: cloudCollections });
        } else if (response.status !== 401) { // Ignore unauthorized
            throw new Error("Failed to fetch collections");
        }
    } catch (error) {
        console.error("Could not fetch cloud collections", error);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        dispatch({ type: 'SET_USER', payload: data.user });
        await fetchCloudCollections();
        toast({ title: 'Login Successful', description: `Welcome back, ${data.user.email}!`});
        return true;
    } catch (error) {
        toast({ variant: 'destructive', title: 'Login Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
        return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        await login(email, password); // Auto-login after successful registration
        return true;
    } catch (error) {
        toast({ variant: 'destructive', title: 'Registration Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
        return false;
    }
  };

  const logout = async () => {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        dispatch({ type: 'SET_USER', payload: null });
        // Keep local collections but remove cloud ones
        const localCollections = state.collections.filter(c => !c.userId);
        dispatch({ type: 'SET_INITIAL_STATE', payload: { ...state, collections: localCollections } });
        toast({ title: 'Logout Successful' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Logout Failed' });
    }
  };
  
  // Check session on initial load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if(res.ok) {
            const data = await res.json();
            if (data.user) {
                dispatch({ type: 'SET_USER', payload: data.user });
                await fetchCloudCollections();
            }
        }
      } catch (error) {
        console.error("Session check failed", error);
      }
    };
    checkSession();
  }, [fetchCloudCollections]);


  return (
    <ApiAceContext.Provider value={{
      state,
      dispatch,
      createCollection,
      deleteCollection,
      updateCollection,
      importCollections,
      exportCollection,
      openRequestInTab: (request: ApiRequest) => {
        const req = findRequestById(request.id);
        openRequestInTab(req ?? request);
      },
      sendRequest,
      cancelRequest,
      createRequest,
      deleteRequest,
      login,
      register,
      logout,
    }}>
      {children}
    </ApiAceContext.Provider>
  );
};

export const useApiAce = (): ApiAceContextType => {
  const context = useContext(ApiAceContext);
  if (context === undefined) {
    throw new Error('useApiAce must be used within an ApiAceProvider');
  }
  return context;
};

    