
docker build . -t gcr.io/cerbos-playground/demo-express-magiclink-cerbos-pdp:latest
docker push gcr.io/cerbos-playground/demo-express-magiclink-cerbos-pdp:latest

gcloud --project cerbos-playground run deploy --platform managed --region europe-west1 --image gcr.io/cerbos-playground/demo-express-magiclink-cerbos-pdp:latest demo-express-magiclink-cerbos-pdp