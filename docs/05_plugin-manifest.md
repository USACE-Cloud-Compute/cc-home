# Anatomy of a plugin manifest

The plugin manifest file is used to establish what will run and what resources need to be provisioned for it. It is primarily used to "register" a plugin with a compute provider and is analogous to a job description in AWS Batch.

## Core Attributes

The plugin manifest is a json file with the following sections:

| Attribute             | Description                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`                | the name of the plugin. This is the name that will be used by compute provider                                                                                                                                                                                                                                                                                                                                                       |
| `image_and_tag`       | container repository information. for example `0000000000.dkr.ecr.us-east-1.amazonaws.com/mycompute:1.0`                                                                                                                                                                                                                                                                                                                             |
| `description`         | optional brief description of the plugin                                                                                                                                                                                                                                                                                                                                                                                             |
| `command`             | optional array of command parameters for running the plugin. If omitted, the Docker CMD or ENTRYPOINT is used. Parameter substitution using [AWS Batch syntax](https://docs.aws.amazon.com/batch/latest/userguide/job_definition_parameters.html#parameters) is supported. Adding the command value regardless of the build is recommended so that users can understand exactly what is being executed to facilitate troubleshooting |
| `compute_environment` | an object containing compute environment/resource requirements (discussed in more detail below)                                                                                                                                                                                                                                                                                                                                      |
| `environment`         | a set of key/value pairs for values that will be injected into the environment of the running plugin                                                                                                                                                                                                                                                                                                                                 |
| `credentials`         | a set of key/value pairs for values that will be mapped from the compute provider credential management system into the environment of the running plugin                                                                                                                                                                                                                                                                            |
| `retry_attempts`      | optional integer representing the number of times a plugin will retry if it fails. default is 0 which is no retry                                                                                                                                                                                                                                                                                                                    |
| `execution_timeout`   | optional timeout in seconds. If a running plugin exceeds this duration, it will be terminated. the default null or empty value is equivalent to no timeout                                                                                                                                                                                                                                                                           |
| `privileged`          | optional boolean that grants elevated privileges to the plugin. The default value is false. Per the docker documentation, if true this boolean grants all capabilities to the container and lifts most security limitations, giving it nearly all the same access as processes running on the host machine. This is used to support host devices such as fuse file systems.                                                          |
| `linux_parameters`    | generally used in conjunction with "privileged=true", this section maps host devices to running plugins                                                                                                                                                                                                                                                                                                                              |

## Compute Environment

- `compute_environment`: the compute environment is an object that accepts virtual cpu, memory, and extra hosts parameters.
  | Attribute | Description |
  |-----------|----------|
  | `vcpu` | this is the virtual cpu number using units for the compute provider. For example with running locally on docker, this is the number of threads from the local CPU. In AWS EC2, this value is the number of vcpu threads from the host ec2 system. |
  | `memory` | the memory (i.e. ram) to allocate to the plugin in MB. For example to allocate 8GB, `memory=8192` |
  | `extraHosts` | an optional list of strings configuring extra hosts. This is generally used to support local docker compute. For example the value `"extraHosts": ["host.docker.internal:host-gateway"]` creates an internal mapping of "host.docker.internal", to the host machine's "localhost".

  a sample compute environment might look like:

  ```json
  "compute_environment":{
      "vcpu":"2",
      "memory":"2000",
      "extraHosts": ["host.docker.internal:host-gateway"]
  },
  ```

## Environment Configuration

- `environment`: This is the configuration of environment variables that will be injected into the running container. The configuration consists of a list of object key value pairs with `name` mapping to the name of the environment variable, and `value` mapping to the value. An example environment configuration is:

  ```json
  "environment":[
      {
          "name":  "AWS_REGION",
          "value": "us-east-1"
      },
      {
          "name":  "AWS_S3_BUCKET",
          "value": "project-data"
      },
      {
          "name":  "AWS_S3_ENDPOINT",
          "value": "host.docker.internal:9000"
      },
      {
          "name":  "AWS_HTTPS",
          "value": "NO"
      },
      {
          "name":  "AWS_VIRTUAL_HOSTING",
          "value": "FALSE"
      }
  ],
  ```

## Credentials Configuration

- `credentials`: This is the configuration of environment variables that will be injected into the running container. The configuration consists of a list of object key value pairs with `name` mapping to the name of the environment variable, and `value` mapping to the value. An example environment configuration is:

  ```json
  "credentials":[
      {
          "name":  "AWS_ACCESS_KEY_ID",
          "value": "secretsmanager:AWS_ACCESS_KEY_ID::"
      },
      {
          "name":  "AWS_SECRET_ACCESS_KEY",
          "value": "secretsmanager:AWS_SECRET_ACCESS_KEY::"
      }
  ],
  ```

## Linux Parameters

- `linux_parameters`: linux parameters are used to map host environment assets into the plugin environment. Currently only device mapping is supported. The "device" attribute consists of an array of linux devices with each device having a "host_path" and "container_path" string. An example configuration that performs a fuse mount inside the plugin is:

  ```json
  "privileged":true,
  "linux_parameters":{
      "devices":[
          {
              "host_path":"/dev/fuse",
              "container_path":"/dev/fuse"
          }
      ]
  },
  ```
