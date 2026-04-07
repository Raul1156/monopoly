echo "📥 Descargando novedades de GitHub..."
cd ~/monopoly
git fetch
git checkout master
git pull origin master

echo "🔪 Matando procesos antiguos..."
pkill -f "dotnet"
pkill -f "vite"
pkill -f "node"

echo "🚀 Arrancando Backend (C#)..."
cd ~/monopoly/backend-csharp
nohup dotnet run --urls "http://0.0.0.0:5000" > backend.log 2>&1 &

echo "🎨 Arrancando Frontend (Vite)..."
cd ~/monopoly
rm -rf node_modules/.vite
nohup npm run dev -- --host 0.0.0.0 --force > frontend.log 2>&1 &

echo "✅ ¡Servidor actualizado y funcionando! (Espera 15 segundos a que C# compile)"