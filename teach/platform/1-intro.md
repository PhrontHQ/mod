# Mod Platform

## Intro

Mod projects, both front-end and back-end parts, have to be built, distributed across multiple emvironments with varying infrastructure, from a local modding environment on a laptop where the sole user is typically the developer, to test, stage and finally production/live where the end-mod will reach its intended audience. Mod is making choices and provides solutions for all of this which we'll group under the term "platform".

platform (a platform.mod ? or all in here?) will host various files and logic related to trechnology used such as Kubernetes, Docker, or Terraform which project structure files cover all three categories: build, deployment, and infrastructure. While they often overlap, each file serves a distinct primary purpose in the software development lifecycle.

When Mod Workers have been distributed as serverless functions, they were actually deployed within containers, but in a way that's hidden by cloud vendor's distribution/deployment APIs

What we need is a strategy that is consistent from local modding all the way to live deployement, and through as many intermediate stages as desired. Modding locally has a different set of requirement, first is that it has to be as fast as no-build, and the ability to immediately test changes across mutliple dependencies that are actually checked-out from their git repository and 

Not all aspects of the approach Mod is using are available as an existing service on every cloud vendors. For example, there's no equivalent of AWS' API Gateway on Google Cloud. So we'll standardize the deployment of this project on Kubernetes, either using cloud vendor's own engines as a service, but there's always the ability to run a Kubernetes cluster on any self-maintained hardware as well. 

For Workers, which have been designed to be deployed serverless and tested as such on AWS, it's still desirable to be able to deployed them directly on Kubernetes, for load profiles that makes cloud vendors' serverless procing challenging, or that aren't a match for those functions' runtimes constraints like maimeximum length of execution, memory constraints, etc... Deploying Workers, like the Worker Gateway will be that alternative.

Finally, we'll have to finalize a strategy that is consistent across environments and work on local laptops fro development, on-premise for deployment that require offline capabilities and cloud as well.  

## 1. Build Files

These files are used to transform your source code into a portable, runnable package (a container image).

- Dockerfile: This is the primary build script. It contains instructions for the Docker Engine to install dependencies, compile code, and package the application into an image.
- .dockerignore: Similar to a .gitignore, this file speeds up the build process by preventing unnecessary local files (like node_modules or local logs) from being sent to the Docker Build context.
- Multi-stage Dockerfiles: These are used to separate the "build-time" environment from the "run-time" environment to keep final images small and secure.

## 2. Deployment Files

These files define how your application should run once it is built. They focus on scaling, networking, and runtime configurations.

- Docker Compose (docker-compose.yml): Primarily used for local development or simple environments. It defines how multiple containers (e.g., a web app and a database) interact and run together on a single host.
- Kubernetes Manifests (YAML): Files like deployment.yaml and service.yaml tell Kubernetes how many replicas of your app to run, how to handle updates (rollouts), and how to expose the app to the internet.
- Helm Charts: These act as "package managers" for Kubernetes. They use templates to manage complex deployments across different environments (dev, staging, production) using a single set of configuration files.

## 3. Infrastructure Files

In modern "Infrastructure as Code" (IaC) workflows, these files define the actual servers or clusters where the deployments live.

- Kubernetes Cluster Definitions: While basic manifests handle "workloads," files for tools like Terraform or Pulumi are used to provision the underlying infrastructure (like an AWS EKS or Google GKE cluster) before you can deploy anything to it.
- ConfigMaps & Secrets: Within Kubernetes, these files manage "environment infrastructure" by providing configuration and sensitive data (like API keys) to the application without hardcoding them into the build.
- Networking & Storage: Files like ingress.yaml (for routing traffic) and persistent-volume.yaml (for attaching storage) manage the virtual infrastructure your app relies on.

## Summary Comparison Table


| Category  | Primary Tool | Common Files | Purpose |
| --- | ------ | ------ | ------ |
| Build  |   Docker   |   Dockerfile, .dockerignore   |   Creates the application image.   |
| Deployment  |   K8s / Compose   |   deployment.yaml, docker-compose.yml   |   Manages how the app runs and scales.   |
| Infrastructure  |    Terraform / K8s   |   main.tf, pv.yaml, ingress.yaml   |   Sets up the environment and resources.   |


## Proposed languaging and structure


The chosen environment workflow names perfectly align in alphabetical order while mapping to the pipeline sequence. By prioritizing alphabetical order, this creates a completely self-sorting pipeline that naturally organizes itself in files, configuration dropdowns, etc... 

How those Terms Map to the Industry Standards:
- Mod (Sandbox / Local Dev)The Role: Where code is actively modified, experimented on, and broken in isolation.
- Preview (Develop / Integration)The Role: The first time separate "mods" are merged together to look at the combined product.
- Probe (QA / Testing)The Role: Deep-diving, poking, and prober-testing for bugs, security gaps, and edge cases.
- Sign-off (Staging / Pre-Prod)The Role: The final gate where stakeholders review the polished package and approve the launch.
- Use (Production / Live)The Role: The actual end-state where customers interact with and derive utility from the application.

The Major Advantage of this approach: In standard DevOps, systems usually sort environments alphabetically by default, which turns standard names into a chaotic mess (Development, Production, QA, Staging). This forces teams to prefix names with numbers (e.g., 1-dev, 2-qa), while this system completely solves this UI annoyance naturally.


platform/
├── common/             # Shared resources common to all environments: Terraform modules, shared scripts, base Docker images
│   ├── provision/      # Create infrastructure
│   ├── release/        # build source code into production-ready artefacts that are then distributed onto the infrastructure provisioned
│   └── test/           # tests to ensure that everythig went as planned
├── mod/
│   ├── provision/      # in a local context, this would mean create locally the infrastruture that match production's one as closely as possible 
│   ├── release/        # in a local context, this could mean release for local debugging
│   └── test/
├── preview/
│   ├── provision/
│   ├── release/
│   └── test/
├── probe/
│   ├── provision/
│   ├── release/
│   └── test/
├── sign-off
│   ├── provision/
│   ├── release/
│   └── test/
└── use/
    ├── provision/
    ├── release/
    └── test/

If needed, the release folder could be broken down into:

└── release/
    ├── build/
    ├── distribute/

if we feel we need / want that level of details



the name of the "use" environment is never visible to the outside, but the ones beforer should:

https://mod.mydomain.com
https://preview.mydomain.com
https://probe.mydomain.com
https://sign-off.mydomain.com
https://mydomain.com
