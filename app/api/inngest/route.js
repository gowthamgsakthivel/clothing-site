
import { serve } from "inngest/next";
import { createUserOrder, inngest, syncUserCreation, syncUserDeletion, syncUserUpdation } from "@/config/inngest";
import Order from "@/models/Orders"; // Ensure Order model is loaded for Inngest

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        syncUserCreation,
        syncUserUpdation,
        syncUserDeletion,
        createUserOrder
    ],
});  