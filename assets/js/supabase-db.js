// Supabase Database Functions
// This file handles all database operations for saving/loading projects

// Initialize Supabase client (will be set after supabase-js loads)
let supabase = null;

// Initialize the Supabase client
function initSupabase() {
    if (typeof supabase === 'object' && supabase !== null) {
        return; // Already initialized
    }
    
    if (typeof createClient === 'undefined') {
        console.error('Supabase client library not loaded');
        return;
    }
    
    supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Supabase client initialized');
}

// Generate a random project ID (8 characters: letters and numbers)
function generateProjectId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Generate auto project name
function generateProjectName() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Castle Schedule - ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

// Create a new project in Supabase
async function createProject(alliances, schedule) {
    if (!supabase) {
        console.error('❌ Supabase not initialized');
        return null;
    }
    
    const projectId = generateProjectId();
    const projectName = generateProjectName();
    
    const projectData = {
        id: projectId,
        name: projectName,
        data: {
            alliances: alliances,
            schedule: schedule
        },
        version: 1
    };
    
    console.log('📝 Creating project:', projectId);
    
    try {
        const { data, error } = await supabase
            .from('projects')
            .insert([projectData])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error creating project:', error);
            return null;
        }
        
        console.log('✅ Project created successfully:', data);
        return data;
    } catch (err) {
        console.error('❌ Exception creating project:', err);
        return null;
    }
}

// Load a project from Supabase
async function loadProject(projectId) {
    if (!supabase) {
        console.error('❌ Supabase not initialized');
        return null;
    }
    
    console.log('📥 Loading project:', projectId);
    
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        
        if (error) {
            console.error('❌ Error loading project:', error);
            return null;
        }
        
        console.log('✅ Project loaded successfully:', data);
        return data;
    } catch (err) {
        console.error('❌ Exception loading project:', err);
        return null;
    }
}

// Update an existing project (autosave)
async function updateProject(projectId, alliances, schedule, currentVersion) {
    if (!supabase) {
        console.error('❌ Supabase not initialized');
        return null;
    }
    
    console.log('💾 Updating project:', projectId);
    
    const updateData = {
        data: {
            alliances: alliances,
            schedule: schedule
        },
        updated_at: new Date().toISOString(),
        version: currentVersion + 1
    };
    
    try {
        const { data, error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', projectId)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error updating project:', error);
            return null;
        }
        
        console.log('✅ Project updated successfully:', data);
        return data;
    } catch (err) {
        console.error('❌ Exception updating project:', err);
        return null;
    }
}

// Check if a project exists
async function projectExists(projectId) {
    if (!supabase) {
        console.error('❌ Supabase not initialized');
        return false;
    }
    
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .single();
        
        return !error && data !== null;
    } catch (err) {
        return false;
    }
}
