@echo off
cd /d "F:\2026 Laptop Document_files\stallHq\stallhq-mobile\android"
set EXPO_PUBLIC_SUPABASE_URL=https://ikmxzqofxrhdgxrtogtw.supabase.co
set EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrbXh6cW9meHJoZGd4cnRvZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NTE4ODksImV4cCI6MjA5NzMyNzg4OX0.0vzvCabyGvWdFwsn2jfB87KnH8CLweW63LXGcfRxDe8
set EXPO_PUBLIC_WEB_API_URL=https://hqlink.vercel.app
set ANDROID_HOME=F:\dev\Android\Sdk
set JAVA_HOME=F:\dev\jdk
call gradlew.bat :app:createBundleDebugJsAndAssets --rerun-tasks >> "..\build.log" 2>&1
if errorlevel 1 exit /b 1
call gradlew.bat assembleDebug >> "..\build.log" 2>&1
exit /b %errorlevel%
