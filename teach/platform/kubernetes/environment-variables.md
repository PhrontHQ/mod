If you want to pass environment variables to your Kubernetes resources using kubectl, there are two main ways to go about it: injecting them directly into the YAML file at runtime or using a separate command to update an existing resource.

## 1. Direct Substitution (Recommended for CI/CD)

The most common way to "pass" a local shell variable into a static YAML file is to use envsubst. This tool replaces placeholders in your file (like $MY_VAR) with the values currently in your shell.

### Step 1: Add a placeholder to your YAML

```
yaml
# deployment.yaml
spec:
  containers:
  - name: my-app
    image: my-image:latest
    env:
    - name: API_KEY
      value: "${API_KEY_ENV}" # Placeholder
```

### Step 2: Run the command

```
bash
export API_KEY_ENV="your-secret-key"
envsubst < deployment.yaml | kubectl apply -f -
```

Note: The - at the end of the kubectl command tells it to read from standard input (the piped output of envsubst).

## 2. Using kubectl set env (For Quick Updates)

If your deployment is already running and you just want to update or add a variable without editing the file manually, you can use the kubectl set env command.

```
bash
kubectl set env deployment/my-deployment API_KEY=new-value
```

This command automatically triggers a rolling update of your pods with the new environment variable.

## 3. Hardcoding in the YAML Spec

If the value isn't dynamic, you can define environment variables directly in the env field of your Pod or Deployment manifest:

```
yaml
spec:
  containers:
  - name: my-container
    env:
    - name: DB_URL
      value: "postgres://localhost:5432"
```

## Best Practice: ConfigMaps and Secrets

For better management, especially if you have many variables, it is standard practice to store them in a ConfigMap or Secret and reference them in your YAML:

```
yaml
envFrom:
- configMapRef:
    name: my-config-map
```

Summary of Options:


|  Goal | Tool/Method |
| --- | ------ |
| Pass shell vars to YAML  |   `envsubst < file.yaml   |
|  Update existing resource |  kubectl set env    |
|  Production-grade config |  ConfigMaps or Secrets  |
|  Templating complex setups |  Helm or Kustomize  |


Reference:
[Dead Simple: Include Env. Variables in Kubernetes Deployment (YAML)](https://medium.com/programmers-journey/dead-simple-include-env-variables-in-kubernetes-deployment-yaml-1c0e8f859fde)