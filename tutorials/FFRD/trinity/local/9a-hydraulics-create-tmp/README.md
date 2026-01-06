## Create TMP
The purpose of this is to remove the results block from HDF files uploaded remotely. HEC-RAS cannot compute on an HDF file containing a results block. This step should be done every time a modeler uploads an HEC-RAS model remotely, and should be done prior to starting any computes. It should not be done as an action with a compute when many events are being computed because it will be pulling a full results block into each container and represents a massive amount of unnecessary data transfer.

## Usage Notes
This manifest is very generic and needed by all HDF plan results files for any project using HEC-RAS. The only changing parameter is typically the Model Prefix. The tutorial uses the "per-event-loop" to push out multiple jobs pointing at the same manifest with different environment variables for the "MODEL_PREFIX" environment varialbe to reduce duplication of manifests.

## Relevant Actions documentation
https://github.com/USACE/cc-ras-runner/blob/main/actions/utils/copy-inputs-action.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/utils/create-ras-tmp.md


## parametrization for the tutorial
# copy-inputs
| Attribute | Description | Value |
|-----------|----------|-------------|
| not applicable | |

# create-ras-tmp
| Attribute | Description | Value |
|-----------|----------|-------------|
| `src` | the pathname of the hdf file to be converted (copied in with a copy action) | clear-creek.p01.hdf |
| `local_dest` | the local file name to create | clear-creek.p01.tmp.hdf |
| `remote_dest` | the name of the datasource in the remote output destination | clear-creek.p01.tmp.hdf |
| `save_to_remote` | a flag to indicate that the hdf file should be saved to remote as part of the action execution | true |

## required inputs

| Datasource Name | Path Key | Path Value (resolved from substitution) |
|-----------|----------|-------------|
| clear-creek.p01.hdf | 0 | /conformance/hydraulics/clear-creek/clear-creek.p01.hdf |
