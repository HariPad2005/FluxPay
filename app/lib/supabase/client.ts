import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
    workspaces: {
        id: string;
        name: string;
        manager_address: string;
        channel_id: string | null;
        created_at: string;
    };
    employees: {
        id: string;
        wallet_address: string;
        name: string;
        created_at: string;
    };
    tasks: {
        id: string;
        workspace_id: string;
        employee_address: string;
        title: string;
        description: string;
        reward_amount: number;
        status: 'pending' | 'completed' | 'approved' | 'paid';
        created_at: string;
        completed_at: string | null;
        approved_at: string | null;
        paid_at: string | null;
    };
};
