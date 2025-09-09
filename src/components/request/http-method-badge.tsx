import { HttpMethod } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HttpMethodBadgeProps {
    method: HttpMethod;
    className?: string;
}

const methodColors: Record<HttpMethod, string> = {
    GET: "bg-green-600 hover:bg-green-700",
    POST: "bg-blue-600 hover:bg-blue-700",
    PUT: "bg-yellow-600 text-black hover:bg-yellow-700",
    DELETE: "bg-red-600 hover:bg-red-700",
    PATCH: "bg-purple-600 hover:bg-purple-700",
    OPTIONS: "bg-gray-500 hover:bg-gray-600",
    HEAD: "bg-pink-600 hover:bg-pink-700",
};

export function HttpMethodBadge({ method, className }: HttpMethodBadgeProps) {
    return (
        <Badge
            variant="default"
            className={cn(
                "w-16 text-center justify-center font-bold text-white",
                methodColors[method],
                className
            )}
        >
            {method}
        </Badge>
    );
}
