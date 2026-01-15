<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1BVDXvWTQ20o5TAb4K9-UITliLqP1Ld8B

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# livego-
# livego
cd /var/www/livego
   


mongosh "mongodb://appuser:adriano123@72.60.249.175:27017/appdb?authSource=appdb"


docker  docker exec -it mongodb mongosh -u appuser -p adriano123 --authenticationDatabase appdb



pm2 delete livego-api
pm2 start dist-server/server.js --name livego-api --env production
pm2 save
pm2 logs livego-api
