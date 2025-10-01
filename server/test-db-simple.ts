import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

console.log("🔍 Testing Database Connection...");
console.log("Environment variables:");
console.log("- VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL ? "✅ Set" : "❌ Missing");
console.log("- SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing");

async function testDatabase() {
  try {
    const { getSupabaseAdminClient } = await import("../shared/supabase");
    const supabase = getSupabaseAdminClient();
    
    console.log("\n📡 Testing database connection...");
    
    // Test connection with a simple query
    const { data, error } = await (supabase as any)
      .from('departments')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log("❌ Database connection failed:", error.message);
      return false;
    }

    console.log("✅ Database connection successful!");
    
    // Test table accessibility
    const tables = ['departments', 'faculty', 'subjects', 'classrooms', 'student_batches'];
    console.log("\n📋 Testing table accessibility...");
    
    for (const table of tables) {
      try {
        const { error: tableError } = await (supabase as any)
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (tableError) {
          console.log(`❌ Table '${table}': ${tableError.message}`);
        } else {
          console.log(`✅ Table '${table}': Accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': Error - ${err}`);
      }
    }
    
    console.log("\n🎉 Database verification complete!");
    console.log("\n📋 Available API endpoints for database operations:");
    console.log("- GET  /api/database/test-connection");
    console.log("- POST /api/database/verify-crud");
    console.log("- GET  /api/database/status");
    console.log("- POST /api/database/populate-sample");
    console.log("\n🚀 Start your server with 'npm run dev' to use these endpoints!");
    
    return true;
  } catch (error) {
    console.log("💥 Setup failed:", error);
    return false;
  }
}

testDatabase();