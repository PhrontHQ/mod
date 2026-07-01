## Resources:

- [2LOCAL KUBERNETES SHOWDOWN: K3D,KIND,MINIKUBE,MICROK8S,K0S](https://sanj.dev/post/2025-12-11-ultimate-local-kubernetes-showdown-2025)
- [CILIUM VS CALICO VS FLANNEL: KUBERNETES CNI COMPARISON 2026](https://sanj.dev/post/cilium-calico-flannel-cni-performance-comparison)

## Local modding setup for macos

## What is Kubernetes?

[Kubernetes](https://kubernetes.io), or K8s, is an open-source platform that automates the deployment, scaling, and management of containerized applications. Originally designed by Google and now managed by the Cloud Native Computing Foundation (CNCF), it serves as a "cluster operating system" that orchestrates containers across multiple hosts, ensuring high availability, load balancing, and efficient resource utilization.
The name Kubernetes originates from Greek, meaning helmsman or pilot.

### Key Capabilities and Features

- Container Orchestration: Automatically manages the lifecycle of containerized applications, including deployment, scaling, and networking.
- Self-Healing: Automatically restarts, replaces, and reschedules containers that fail or become unresponsive.
- Automatic Scaling: Dynamically scales application resources up or down based on demand to maximize efficiency.
- Automated Rollouts/Rollbacks: Enables seamless updates of applications with the ability to revert to previous versions if issues occur.
- Service Discovery/Load Balancing: Exposes containers using their own IP addresses or a single DNS name, distributing traffic to maintain stability.

### How Kubernetes Works

Kubernetes functions by grouping containers that make up an application into logical units for easy management, known as clusters. A Kubernetes cluster consists of a control plane plus a set of worker machines, called nodes, which can be virtual or physical, that run containerized applications. Every cluster needs at least one worker node in order to run Pods.

- Control Plane (Master Node): The "brains" of the operation, which receives instructions and maintains the desired state of the cluster.
- Nodes (Worker Nodes): The machines that run the actual applications.
- Pods: The smallest deployable unit in Kubernetes, which holds one or more containers.
- YAML/JSON Configuration: Declarative configuration files are used to define how an application should run.

#### Pods vs Nodes

In Kubernetes, the relationship between Pods and Nodes is best described as workload versus infrastructure. A Pod is the smallest unit of execution for your application, while a Node is the physical or virtual machine that provides the resources to run those Pods.

###### Core Comparison


| Feature    | Pod                                               | Node                                                   |
| ------------ | --------------------------------------------------- | -------------------------------------------------------- |
| Definition | A logical grouping of one or more containers.     | A physical or virtual worker machine in a cluster.     |
| Role       | The "Workload": defines what runs (e.g., an app). | The "Host": provides CPU, RAM, and storage.            |
| Lifecycle  | Ephemeral: disposable and easily replaced.        | Persistent: remains until manually removed or failure. |
| Unit       | Atomic unit of deployment and replication.        | Basic unit of infrastructure and scaling.              |
| Hierarchy  | Runs inside a Node                                | Hosts multiple Pods simultaneously.                    |

###### Key Components

- Control plane
  - [kube-apiserver](https://kubernetes.io/docs/concepts/architecture/#kube-apiserver)
    The API server is a component of the Kubernetes control plane that exposes the Kubernetes API. The API server is the front end for the Kubernetes control plane.
  - [etcd](https://kubernetes.io/docs/concepts/architecture/#etcd)
    Consistent and highly-available key value store used as Kubernetes' backing store for all cluster data.
  - [kube-scheduler](https://kubernetes.io/docs/concepts/architecture/#kube-scheduler)
    Control plane component that watches for newly created Pods with no assigned node, and selects a node for them to run on.
  - [kube-controller-manager](https://kubernetes.io/docs/concepts/architecture/#kube-controller-manager)
    Control plane component that runs controller processes.

    Logically, each controller is a separate process, but to reduce complexity, they are all compiled into a single binary and run in a single process.

    There are many different types of controllers. Some examples of them are:

    - Node controller: Responsible for noticing and responding when nodes go down.
    - Job controller: Watches for Job objects that represent one-off tasks, then creates Pods to run those tasks to completion.
    - EndpointSlice controller: Populates EndpointSlice objects (to provide a link between Services and Pods).
    - ServiceAccount controller: Create default ServiceAccounts for new namespaces.

The above is not an exhaustive list.

- [cloud-controller-manager](https://kubernetes.io/docs/concepts/architecture/#cloud-controller-manager)
  Embeds cloud-specific control logic. The cloud controller manager lets you link your cluster into your cloud provider's API, and separates out the components that interact with that cloud platform from components that only interact with your cluster.
  The cloud-controller-manager only runs controllers that are specific to your cloud provider. If you are running Kubernetes on your own premises, or in a learning environment inside your own PC, the cluster does not have a cloud controller manager.

  As with the kube-controller-manager, the cloud-controller-manager combines several logically independent control loops into a single binary that you run as a single process. You can scale horizontally (run more than one copy) to improve performance or to help tolerate failures.

  The following controllers can have cloud provider dependencies:

  - Node controller: For checking the cloud provider to determine if a node has been deleted in the cloud after it stops responding
  - Route controller: For setting up routes in the underlying cloud infrastructure
  - Service controller: For creating, updating and deleting cloud provider load balancers
- Pods (Application Layer)

  - Containers: A Pod acts as a wrapper for one or more containers (like Docker) that share the same network IP and storage volumes.
  - Networking: Every Pod gets a unique IP address within the cluster, allowing containers inside to communicate via localhost.
  - Templates: Pods are rarely created manually; they are usually managed by controllers like Deployments or StatefulSets.
- Nodes (Infrastructure Layer)

  - Kubelet: The primary "node agent" that communicates with the control plane and ensures containers are running inside their Pods.
  - Container Runtime: The software (e.g., containerd, CRI-O) that actually executes the containerized applications.
  - Kube-proxy: A network proxy that handles internal networking rules and traffic routing for the node.

###### Relationship and Behavior

- Scheduling: The Kubernetes Control Plane automatically schedules Pods onto Nodes based on available CPU and memory.
- Placement Control: You can influence where Pods land using Node Affinity (attracting Pods to specific nodes) or Taints and Tolerations (repelling Pods from nodes).
- Self-Healing: If a Pod crashes, Kubernetes restarts it. If a Node fails, Kubernetes reschedules the Pods that were on it onto other healthy nodes in the cluster.
- Scaling: To scale your application, you add more Pods (Horizontal Pod Autoscaling). To scale your infrastructure when nodes are full, you add more Nodes (Cluster Autoscaling).

### Kubernetes vs. Docker

While Docker is a tool for creating container images, Kubernetes is the engine that manages and runs those containers in production at scale. They are considered complementary rather than competing technologies.

### Why Use Kubernetes?

As applications evolve into microservices, managing them manually becomes impossible. Kubernetes provides a consistent, portable framework to run applications across on-premises, public clouds, or hybrid environments.

### Learn More

at [https://kubernetes.io/](https://kubernetes.io/) startting with [Concepts](https://kubernetes.io/docs/concepts/).

## Stack

- ### Lima

  [Lima (Linux Machines)](https://lima-vm.io) is an [open-source](https://github.com/lima-vm/lima) tool that launches Linux virtual machines on macOS, designed to easily run containerd and nerdctl. It provides a lightweight alternative to Docker Desktop with automatic file sharing and port forwarding, often described as a "macOS subsystem for Linux" or "Linux-on-Mac". It is now a CNCF Sandbox project.
- ### Colima

  [Colima](https://colima.run) (Containers on Lima for macOS/Linux) is an [open-source](https://github.com/abiosoft/colima) CLI tool that wraps Lima to provide a lightweight, Docker Desktop-alternative container runtime on macOS and Linux. While Lima launches containerd by default, Colima focuses on running Docker or containerd within a Lima-managed virtual machine.

## Install

- ### Homebrew


  - #### Install

    Follow instructions on (https://brew.sh)
  - #### Update

    ```
    brew update
    ```
- ### Colima, Docker, Kubectl

  Install Colima along with the Docker and Kubernetes command-line tools:


  ```
  brew install colima docker kubectl
  ```

## ▶️ Run: Start Kubernetes with Colima

With Colima installed, you should be able to start a Colima instance. There are a handful of options to control the CPU, disk, and memory allocation for the VM, the runtimes to configure on it, etc.

```
colima start --kubernetes --runtime containerd
```

Verify Docker is working:

```
docker version
docker run hello-world
```


Check that the Docker and Kubernetes command-line tools have been configured to talk to the new Colima instance:

```
kubectl cluster-info
```

```
kubectl get pods -A
```

```
kubectl get nodes
```

```
docker ps
```

### ⚙️ Optional: Configure Resources
You can customize Colima’s CPU, memory, and disk size for heavier workloads:

```
colima stop
colima start --cpu 4 --memory 4 --disk 100
```


## 🔄 Stop/Delete Colima (If Needed)
To stop or clean up your environment:

```
colima stop    # Stops the VM
colima delete  # Deletes the VM
```



## Deploy an App

```
kubectl create deployment hello-node --image=nginxdemos/hello
```
This command told Kubernetes, “Hey, please run this containerized NGINX demo app.”
Then, I exposed the deployment so it could receive traffic:

```
kubectl expose deployment hello-node --type=LoadBalancer --port=80
```
This created a service to route network requests to my app.

## Accessing the App

Kubernetes assigned your service an IP inside the Colima VM (something like 192.168.5.1), but this IP wasn’t directly reachable from your Mac’s browser. To solve this, you use Kubernetes’ port-forwarding:

```
kubectl port-forward service/hello-node 8080:80
```
This forwards traffic from your Mac’s port 8080 to the app’s port 80 inside the cluster.
Then, open http://localhost:8080 in your browser should show the friendly NGINX welcome page — proof that your Kubernetes cluster is serving traffic!


## References

- [Use Colima for Docker and Kubernetes development on your Mac.](https://passingcuriosity.com/2023/colima-docker-on-mac/)
- [My Journey Learning Kubernetes on Mac with Colima: A Beginner’s Story](https://ishan941.medium.com/my-journey-learning-kubernetes-on-mac-with-colima-a-beginners-story-1d4f44a86b03)
- [Cloud Native development with Colima](https://dischord.org/2024/10/27/cloud-native-development-with-colima/)
- [development locally on macOS using Colima](https://github.com/projectcontour/contour/discussions/6078)