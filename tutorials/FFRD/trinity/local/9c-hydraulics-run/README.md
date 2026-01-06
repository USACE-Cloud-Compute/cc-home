## Hydraulics Run
The purpose of this series of compute manifests is to run two parallel HEC-RAS models that feed into a downstream HEC-RAS model.

The models ray-roberts and clear-creek are headwater HEC-RAS models with no upstream RAS model dependencies, they depend only on HEC-ResSim, HEC-HMS, and fragility curve sampling. 

The lewisville RAS model is dependent on clear-creek and ray-roberts and is set to run when they complete.

Each RAS model has a slightly different configuration of actions, but all three have a few actions in common. 
* copy-inputs
* update-breach-bfile
* compute-unsteady
The action copy-inputs copies all inputs locally, update-breach-bfile updates the b file to contain the sampled breach trigger elevaitons for levees and dams, and the compute unsteady action computes an unsteady simulation.

Both ray-roberts and lewisville have an additional action in common
* update-outlet-ts-bfile
This action updates the bfile with the previously stored time series of regulated flows set in the hdf file. RAS 6x branch reads time series overrides for 2d structures from the b file not the HDF file. 

The lewisville model has an action for each upstream model it is dependent upon to move the refline output timeseries into bcline input time series to pass flow into lewisville from clear-creek and ray-roberts.
* refline-to-bcline

All three models have the follwing extract actions as well.
* extract bcline peak flow and stage
* extract refline peak flow
* extract refline peak wsel
* extract refpoint peak velocity
* extract refpoint peak wsel
* extract structure variable peaks
* extract summary attributes
* extract 2dSA summary attributes
* extract breach summary data

## Relevant Actions documentation
https://github.com/USACE/cc-ras-runner/blob/main/actions/utils/copy-inputs-action.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/link/update-breach-data.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/link/update-outletts-data.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/link/refline-to-bc.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/run/unsteady-simulation.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/extract/hdf/ras-extract-action.md
https://github.com/USACE/cc-ras-runner/blob/main/actions/extract/hdf/ras-breach-action.md

## parametrization for the tutorial
# copy-inputs
This copies all payload level inputs into the container.
| Attribute | Description | Value |
|-----------|----------|-------------|
| not applicable | |
# update-breach-bfile
This reads the hdf file for the Sid names of the 2d connections, reads the fragility curve samples, and writes the breach trigger elevations to the bfile accordingly.
| Attribute | Description | Value |
|-----------|----------|-------------|
| bFile | the b file for the model | clear-creek.b01
| fcFile | the failure elevations samples for the event | failure_elevations.json
| geoHdfFile | the hdf file with geometry inside it (we use the p01.tmp.hdf file)  | clear-creek.p01.tmp.hdf
# update-outlet-ts-bfile
This copies the data stored in hdf from HEC-HMS or HEC-RESSIM in the tmp hdf describing the hourly releases for a structure into the bfile (where RAS actually reads it from during compute).
| Attribute | Description | Value |
|-----------|----------|-------------|
| bFile | the b file for the model | clear-creek.b01
| hdfDataPath | the path to the specific 2d connection with ts outflow overrides | Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/SA Conn: nid_tx08008 (Outlet TS: USGS08051135)
| hdfFile | the hdf file with inserted outflow data | ray-roberts.p01.tmp.hdf
| outletTS | the name of the outlet (should match with the b file and the hdf file) | SA Conn: nid_tx08008 (Outlet TS: USGS08051135)
# refline-to-boundary-condition
This copies data from a computed HEC-RAS model (upstream) and pushes it to the correct location in the ras model about to be computed. The remote hdf file is accessed via a remote call to the bytes of the time series for the refline, so the upstream hdf file (which is large) does not have to be copied local to this container
| Attribute | Description | Value |
|-----------|----------|-------------|
| refline | the refline in the source hdf file per sop naming convention |'clear-creek_to_lewisville|clear-creek'

# action level input data sources
| Input Datasource Name | Path Key | Path Value (resolved from substitution) | Data Path Key | Data Path Value |
|-----------|----------|-------------|---------------| ---------------|
| source | hdf | conformance/simulations/event-data/{ENV::CC_EVENT_IDENTIFIER}/hydraulics/clear-creek/clear-creek.p01.hdf |  refline | Results/Unsteady/Output/Output Blocks/DSS Hydrograph Output/Unsteady Time Series/Reference Lines |

# action level output data sources
| Output Datasource Name | Path Key | Path Value (resolved from substitution) | Data Path Key | Data Path Value |
|-----------|----------|-------------|---------------| ---------------|
| destination | hdf | lewisville.p01.tmp.hdf | bcline | Event Conditions/Unsteady/Boundary Conditions/Flow Hydrographs/2D: Lewisville BCLine: clear-creek_to_lewisville |

## required inputs

| Datasource Name | Path Key | Path Value (resolved from substitution) |
|-----------|----------|-------------|
| clear-creek.p01.tmp.hdf | tmp_hdf | /conformance/simulations/event-data/{ENV::CC_EVENT_IDENTIFIER}/hydraulics/clear-creek/clear-creek.p01.tmp.hdf |
| clear-creek.p01.tmp.hdf | b_file | /conformance/hydraulics/clear-creek/clear-creek.b01 |
| clear-creek.p01.tmp.hdf | o_file | /conformance/hydraulics/clear-creek/clear-creek.ic.o01  |
| clear-creek.p01.tmp.hdf | x_file | /conformance/hydraulics/clear-creek/clear-creek.x01  |
| failure_elevations.json | failure_elevations | /conformance/simulations/event-data/{ENV::CC_EVENT_IDENTIFIER}/system-response/failure_elevations.json |