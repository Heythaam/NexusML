// Service URLs (gateway, Keycloak, MLflow, Airflow) live in public/config.json,
// loaded at runtime by RuntimeConfigService — not here, so they're editable
// after the app is built without needing a rebuild.
export const environment = {
  production: false
};
