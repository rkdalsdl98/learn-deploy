## docker-entrypoint.sh for node.js

echo "wait db server"
dockerize -wait tcp://db:5432 -timeout 20s

echo "init prisma schema"
npx prisma generate
npx prisma db push

echo "start server"
service redis-server start
npm install
npm run start:dev