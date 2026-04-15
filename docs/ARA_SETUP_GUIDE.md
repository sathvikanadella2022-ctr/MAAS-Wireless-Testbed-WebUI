# 5G Testbed ARA-Style Operations Guide

## 1. Purpose

This guide explains how to set up, prepare, and use the 5G Metal-as-a-Service testbed in a step-by-step format similar to formal lab documentation. It is written for students, researchers, and administrators who need to:

- prepare the physical testbed
- connect compute nodes and radios
- verify synchronization and network readiness
- prepare images and lab resources
- schedule reservations
- queue image deployments
- start terminal sessions during active reservation windows

## 2. System Summary

The 5G Metal-as-a-Service (MaaS) platform is a distributed testbed for reproducible 5G experimentation. The portal is one part of the control plane, but the setup process begins with the physical lab environment and resource readiness.

At a high level, the platform includes:

- multiple bare-metal lab PCs
- attached USRP B210 radios
- a centralized login and orchestration workflow
- image provisioning for repeatable experiment setup
- reservation-based access control
- documentation and resource visibility in a single web interface

The current system workflow includes these main operational areas:

- Dashboard
- Reservations
- Image Deployment
- Terminal Access
- Authentication and Role Management

## 3. Testbed Prerequisites

Before starting, make sure the following are available:

- bare-metal lab PCs are powered and reachable
- USRP B210 radios are available and connected to the intended hosts
- Ethernet links and management network are active
- timing and synchronization method is selected
- experiment images are prepared or available for deployment
- portal access is available for scheduling and control

Recommended:

- label each PC and radio pair clearly
- document physical placement of nodes before experiments begin
- leave setup notes for the next user when a node has special constraints

## 4. Testbed Architecture

The testbed currently consists of:

- multiple bare-metal Ryzen-class PCs
- USRP B210 radios attached to selected nodes
- an OS5G subnet for experiment traffic and provisioning
- a centralized access and orchestration workflow
- support for PXE-style image provisioning and repeatable deployment

Each node may be assigned one of several experiment roles:

- gNB host
- UE host
- core network node
- sandbox or validation node

## 5. Physical Testbed Setup Procedure

### Step 1. Position and identify lab nodes

Place the bare-metal nodes in their intended lab positions and verify each one is labeled consistently with the names used in the portal and lab inventory.

### Step 2. Connect each USRP to its assigned host

Attach each USRP B210 to the correct compute node and verify the cable path, USB connectivity, and antenna or RF-chain configuration required for the experiment.

### Step 3. Connect management and experiment networking

Verify that:

- management interfaces are reachable
- the OS5G subnet is available
- PXE or provisioning paths are reachable if imaging will be used

### Step 4. Verify power and hardware readiness

Confirm that:

- each PC boots successfully
- storage is available
- attached radios are detected
- cooling and physical space are adequate for the planned run

### Step 5. Verify synchronization method

The current platform uses PTP for coordination. Before an experiment, confirm that the selected sync method is active and consistent across the nodes participating in the run.

Possible synchronization methods include:

- PTP for general coordinated operation
- GPSDO for higher precision timing
- external clock distribution such as OctoClock for tighter alignment

### Step 6. Prepare experiment images

Select the image required for each node role. This may include:

- OAI gNB image
- OAI core image
- research sandbox image
- custom experiment image

### Step 7. Validate radio and host pairing

Before scheduling users onto the system, validate that each PC and radio pair can support its intended role, such as gNB, UE, or core-network support.

### Step 8. Confirm portal visibility

Once the physical setup is ready, verify that the resources appear correctly in the portal so users can schedule and access them through the documented workflow.

## 6. Access and Authentication Procedure

The portal currently supports two common access flows.

### Option A. Production login

Production authentication uses Globus through the backend `/auth/login` route.

Typical flow:

1. User opens the portal.
2. User selects the production login path.
3. Backend redirects to Globus.
4. After successful authentication, Globus returns the user to `/auth/callback`.
5. Backend redirects the user to the dashboard.

### Option B. Controlled local or lab login

In controlled development or staging conditions, a local login workflow may be used for internal testing, validation, and portal checks before production use.

## 7. Recommended User Workflow

The expected user workflow is:

1. Sign in.
2. Review system and machine status on the dashboard.
3. Create a reservation for a target PC.
4. If needed, queue an image deployment before the reservation starts.
5. Start terminal access only during the active reservation window.
6. End the session and release resources when finished.

## 8. Dashboard Usage

Use the dashboard to:

- verify that lab resources are visible
- identify whether a PC is online, offline, or busy
- confirm whether a device appears usable before scheduling work
- verify whether the physical setup you prepared is reflected correctly in the portal

Status meanings:

- `online`: available for use
- `busy`: currently in use or covered by an active reservation
- `offline`: unavailable

## 9. Reservation Procedure

Reservations control who can use a lab PC and when they can access it.

### Step 1. Open the Reservations page

Navigate to the `Reservations` module from the portal.

### Step 2. Select a target resource

Choose the lab PC you want to reserve.

### Step 3. Enter project information

Provide:

- project name
- short purpose or experiment description

### Step 4. Select start and end times

Choose a future start time and an end time after the start time.

Reservation rules enforced by the backend:

- the reservation must start in the future
- the end time must be later than the start time
- overlapping reservations for the same resource are rejected

### Step 5. Submit the reservation

Click `Reserve Slot`.

If successful:

- the reservation is saved
- the reservation appears in the schedule list
- the portal updates visibility for that machine

### Step 6. Cancel if needed

Users can cancel their own reservations.
Administrators can cancel any reservation.

## 10. Deployment Scheduling Procedure

Image deployment is used when a target PC needs a known software stack before the experiment begins. This is part of testbed preparation, not just portal usage.

### Step 1. Open the Image Deployment page

Navigate to the `Image Deployment` module.

### Step 2. Select a supported PC

Choose a PC that supports imaging.

### Step 3. Select an image

The current portal includes image options such as:

- OAI gNB base image
- OAI core lab image
- research sandbox image

### Step 4. Choose a deployment time

Set the deployment schedule carefully so imaging happens before the experiment window and after any previous user activity has fully ended.

### Step 5. Add notes

Optional notes can include:

- handoff instructions
- custom experiment preparation details
- expected post-deployment validation

### Step 6. Queue the deployment

Click `Queue Deployment`.

Deployment validation rules enforced by the backend:

- a valid resource is required
- a valid image is required
- a valid deployment time is required
- deployment cannot overlap with a reservation window on that same resource

Best practice:

- schedule deployment before the reservation begins
- leave enough buffer time for imaging and validation

## 11. Terminal Access Procedure

Terminal access is gated to protect shared lab resources.

### Step 1. Confirm there is an active reservation

For non-admin users, terminal access to a PC requires an active reservation for that resource at the current time.

### Step 2. Open the Terminal page

Navigate to the `Terminal` module.

### Step 3. Start the session

Submit the request to start a terminal session for the selected resource.

The backend checks:

- user authentication
- valid resource selection
- reservation eligibility
- terminal session safety rules

### Step 4. Work during the approved window

Use the terminal only for the scheduled activity tied to the reservation.

### Step 5. End the session

When finished, end the terminal session through the portal so the session can be cleaned up properly.

## 12. Scheduling Guidance

To avoid conflicts and improve reproducibility, follow this scheduling pattern:

1. Check machine status first.
2. Reserve the PC for the experiment window.
3. Queue deployment before the reservation starts if a new image is needed.
4. Validate the machine at the beginning of the reserved slot.
5. Start terminal access only during the active reserved window.

Recommended operational buffer:

- schedule deployments before the experiment start time
- leave enough time for reboot, PXE or image provisioning, and software verification
- leave time for synchronization checks and radio validation before user experiments
- avoid back-to-back reservations if manual validation is required between users

## 13. Admin Responsibilities

Administrators are expected to:

- monitor users and reservations
- cancel conflicting or invalid reservations when necessary
- review deployment queue activity
- maintain image availability
- verify authentication and access control behavior

## 14. Troubleshooting

### Physical node does not appear ready

Check:

- node has power
- radio is connected correctly
- management network is reachable
- the portal reflects the expected node status

### Reservation creation fails

Common causes:

- missing project or purpose
- invalid start or end time
- reservation starts in the past
- overlapping reservation already exists
- database is unavailable

### Deployment request fails

Common causes:

- no resource selected
- no image selected
- invalid deployment time
- deployment overlaps a reservation
- database is unavailable

### Terminal access is denied

Common causes:

- user is not logged in
- user does not have an active reservation
- selected resource is invalid
- terminal session policy rejected the request

## 15. Summary

The minimum successful flow is:

1. prepare the physical PCs and radios
2. verify networking, timing, and node readiness
3. confirm portal visibility and access
4. reserve a PC
5. schedule image deployment if needed
6. start terminal access during the active reservation
7. end work and leave the resource ready for the next user
