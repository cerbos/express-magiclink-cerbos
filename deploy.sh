
docker build . -t gcr.io/cerbos-playground/demo-express-magiclink-cerbos:latest
docker push gcr.io/cerbos-playground/demo-express-magiclink-cerbos:latest

gcloud --project cerbos-playground run deploy --platform managed --region europe-west1 --image gcr.io/cerbos-playground/demo-express-magiclink-cerbos:latest demo-express-magiclink-cerbos