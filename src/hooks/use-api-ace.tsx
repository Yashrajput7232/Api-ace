"use client";

import type { Collection, ApiRequest, RequestTab, ApiResponse, HttpMethod, KeyValue } from '@/types';
import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from './use-toast';

// --- STATE AND REDUCER ---

interface AppState {
  collections: Collection[];
  activeTabs: RequestTab[];
  activeTabId: string | null;
}

type Action =
  | { type: 'SET_INITIAL_STATE'; payload: AppState }
  | { type: 'ADD_COLLECTION'; payload: Collection }
  | { type: 'DELETE_COLLECTION'; payload: string }
  | { type: 'UPDATE_COLLECTION_NAME'; payload: { id: string; name: string } }
  | { type: 'IMPORT_COLLECTIONS'; payload: Collection[] }
  | { type: 'OPEN_TAB'; payload: ApiRequest }
  | { type: 'CLOSE_TAB'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'UPDATE_ACTIVE_TAB'; payload: Partial<RequestTab> }
  | { type: 'SAVE_ACTIVE_TAB' }
  | { type: 'REQUEST_START'; payload: string }
  | { type: 'REQUEST_SUCCESS'; payload: { tabId: string; response: ApiResponse } }
  | { type: 'REQUEST_ERROR'; payload: { tabId: string; response: ApiResponse } };

const initialState: AppState = {
  collections: [],
  activeTabs: [],
  activeTabId: null,
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return action.payload;

    case 'ADD_COLLECTION':
      return { ...state, collections: [...state.collections, action.payload] };
    
    case 'DELETE_COLLECTION':
      return { ...state, collections: state.collections.filter(c => c.id !== action.payload)};

    case 'UPDATE_COLLECTION_NAME':
      return {
        ...state,
        collections: state.collections.map(c => c.id === action.payload.id ? { ...c, name: action.payload.name } : c)
      };

    case 'IMPORT_COLLECTIONS':
      const newCollections = action.payload.filter(
        (newC) => !state.collections.some((existingC) => existingC.id === newC.id)
      );
      return { ...state, collections: [...state.collections, ...newCollections] };

    case 'OPEN_TAB': {
      const existingTab = state.activeTabs.find(tab => tab.id === action.payload.id);
      if (existingTab) {
        return { ...state, activeTabId: existingTab.id };
      }
      const newTab: RequestTab = { ...action.payload, loading: false, isDirty: false };
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
          const updatedRequests = requestExists
            ? collection.requests.map(r => r.id === activeTab.id ? { ...activeTab, isDirty: false } : r)
            : [...collection.requests, { ...activeTab, isDirty: false }];
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

    case 'REQUEST_SUCCESS':
    case 'REQUEST_ERROR':
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
  createCollection: (name: string) => Collection;
  deleteCollection: (id: string) => void;
  updateCollectionName: (id: string, name: string) => void;
  importCollections: (file: File) => void;
  exportCollection: (collectionId: string) => void;
  openRequestInTab: (requestId: string) => void;
  sendRequest: (tabId: string) => Promise<void>;
  createRequest: (collectionId: string, name: string) => void;
  deleteRequest: (collectionId: string, requestId: string) => void;
}

const ApiAceContext = createContext<ApiAceContextType | undefined>(undefined);

export const ApiAceProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedState = localStorage.getItem('apiAceState');
      if (storedState) {
        dispatch({ type: 'SET_INITIAL_STATE', payload: JSON.parse(storedState) });
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('apiAceState', JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
      toast({
        variant: "destructive",
        title: "Error saving state",
        description: "Could not save to localStorage. Your changes may not be persisted.",
      });
    }
  }, [state, toast]);

  const createCollection = useCallback((name: string): Collection => {
    const newCollection: Collection = { id: crypto.randomUUID(), name, requests: [] };
    dispatch({ type: 'ADD_COLLECTION', payload: newCollection });
    toast({ title: "Collection created", description: `"${name}" has been created.` });
    return newCollection;
  }, [toast]);
  
  const deleteCollection = useCallback((id: string) => {
    dispatch({ type: 'DELETE_COLLECTION', payload: id });
    toast({ title: "Collection deleted" });
  }, [toast]);

  const updateCollectionName = useCallback((id: string, name: string) => {
    dispatch({ type: 'UPDATE_COLLECTION_NAME', payload: { id, name } });
  }, []);

  const openRequestInTab = useCallback((requestId: string) => {
    let requestToOpen: ApiRequest | undefined;
    for (const collection of state.collections) {
      const foundRequest = collection.requests.find(r => r.id === requestId);
      if (foundRequest) {
        requestToOpen = foundRequest;
        break;
      }
    }

    if (requestToOpen) {
      dispatch({ type: 'OPEN_TAB', payload: requestToOpen });
    } else {
      toast({ variant: "destructive", title: "Error", description: "Request not found." });
    }
  }, [state.collections, toast]);
  
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
      headers: [],
      params: []
    };
    
    const updatedCollection: Collection = {
      ...collection,
      requests: [...collection.requests, newRequest]
    }

    dispatch({ 
      type: 'SAVE_ACTIVE_TAB',
      // This is a bit of a hack, but it works.
      // We need to update the collections state with the new request.
      // We can do this by creating a "fake" active tab and saving it.
      // A better way would be a dedicated "ADD_REQUEST" action.
      // But let's stick to the current reducer for now.
    });

    const tempState = appReducer(state, {
      type: 'OPEN_TAB',
      payload: newRequest,
    })

    const newTab: RequestTab = { ...newRequest, isDirty: true, loading: false };

    const finalState = appReducer(
      appReducer(state, { type: 'ADD_COLLECTION', payload: updatedCollection }), 
      { type: 'OPEN_TAB', payload: newRequest }
    );
     const finalStateWithSavedTab = appReducer(
       {...state, collections: state.collections.map(c => c.id === collectionId ? {...c, requests: [...c.requests, newRequest]} : c)}, {
      type: 'SAVE_ACTIVE_TAB'
    })

    dispatch({type: 'SET_INITIAL_STATE', payload: finalStateWithSavedTab})
    openRequestInTab(newRequest.id);


  }, [state.collections, openRequestInTab]);
  
  const deleteRequest = useCallback((collectionId: string, requestId: string) => {
    const updatedCollections = state.collections.map(c => {
      if (c.id === collectionId) {
        return {
          ...c,
          requests: c.requests.filter(r => r.id !== requestId)
        }
      }
      return c;
    });
    dispatch({type: 'SET_INITIAL_STATE', payload: {...state, collections: updatedCollections}})
    dispatch({type: 'CLOSE_TAB', payload: requestId});
    toast({title: 'Request deleted'})
  }, [state, toast]);

  const importCollections = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') throw new Error("Invalid file content");
        const imported = JSON.parse(content);
        
        const collectionsToImport: Collection[] = Array.isArray(imported) ? imported : [imported];
        
        // Basic validation
        collectionsToImport.forEach(c => {
          if (!c.id || !c.name || !Array.isArray(c.requests)) {
            throw new Error("Invalid collection format");
          }
        });

        dispatch({ type: 'IMPORT_COLLECTIONS', payload: collectionsToImport });
        toast({
          title: "Import Successful",
          description: `${collectionsToImport.length} collection(s) imported.`,
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

  const sendRequest = useCallback(async (tabId: string) => {
    const tab = state.activeTabs.find(t => t.id === tabId);
    if (!tab) return;

    dispatch({ type: 'REQUEST_START', payload: tabId });

    const startTime = Date.now();
    try {
      const url = new URL(tab.url);
      tab.params.forEach(param => {
        if (param.enabled && param.key) {
          url.searchParams.append(param.key, param.value);
        }
      });

      const headers = new Headers();
      tab.headers.forEach(header => {
        if (header.enabled && header.key) {
          headers.append(header.key, header.value);
        }
      });
      if(tab.method !== 'GET' && tab.method !== 'HEAD' && tab.body) {
        if(!headers.has('Content-Type')) {
            headers.append('Content-Type', 'application/json');
        }
      }

      const response = await fetch(url.toString(), {
        method: tab.method,
        headers,
        body: (tab.method !== 'GET' && tab.method !== 'HEAD' && tab.body) ? tab.body : undefined,
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

      dispatch({ type: 'REQUEST_SUCCESS', payload: { tabId, response: apiResponse } });
    } catch (error) {
      const endTime = Date.now();
      const apiResponse: ApiResponse = {
        status: 0,
        statusText: 'Fetch Error',
        data: {
          message: error instanceof Error ? error.message : "An unknown error occurred.",
          hint: "This could be a CORS issue. Check the browser console (F12) for more details. The API server must send the 'Access-Control-Allow-Origin' header.",
        },
        headers: {},
        time: endTime - startTime,
        size: 0,
      };
      dispatch({ type: 'REQUEST_ERROR', payload: { tabId, response: apiResponse } });
    }
  }, [state.activeTabs]);

  return (
    <ApiAceContext.Provider value={{
      state,
      dispatch,
      createCollection,
      deleteCollection,
      updateCollectionName,
      importCollections,
      exportCollection,
      openRequestInTab,
      sendRequest,
      createRequest,
      deleteRequest
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
