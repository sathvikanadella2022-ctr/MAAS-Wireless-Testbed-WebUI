import React from 'react';
import {
  Box,
  Chip,
  Divider,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import topologyDiagram from '../assets/testbed-topology.png';

type DocSection = {
  id: string;
  label: string;
  title: string;
  description?: string;
  content: React.ReactNode;
};

const quickFacts = [
  'Distributed bare-metal 5G lab for repeatable experimentation',
  'Reservation-gated resource access for shared hardware',
  'Image deployment workflow for clean experiment resets',
  'Terminal sessions allowed during approved reservation windows'
];

const platformModules = [
  'Dashboard for live resource visibility',
  'Reservations for time-bound access control',
  'Image Deployment for repeatable software provisioning',
  'Terminal Access for active-session operations',
  'Authentication and role management for shared-lab safety'
];

const architectureHighlights = [
  'OS5G subnet for experiment traffic and provisioning',
  'Login and orchestration node for portal-driven workflows',
  'Multiple bare-metal nodes paired with radios for role-based experiments',
  'Support for gNB, core, UE, sandbox, and validation roles'
];

const physicalSetupSteps = [
  'Position and label each bare-metal node so the lab layout matches the recorded inventory.',
  'Attach each USRP B210 to the intended host and confirm USB, antenna, and RF-chain readiness.',
  'Verify management networking, experiment networking, and provisioning connectivity.',
  'Confirm power, storage, cooling, and host hardware readiness before user scheduling.',
  'Validate synchronization, with PTP as the current baseline and GPSDO or external clocking as higher-precision options.',
  'Prepare the required node images for gNB, core, sandbox, or custom experiment roles.',
  'Verify host and radio pairings before opening the system for reservations.',
  'Confirm all prepared resources appear correctly inside the portal.'
];

const reservationRules = [
  'Reservations must start in the future.',
  'End time must be later than start time.',
  'Overlapping reservations for the same resource are rejected.',
  'Users can cancel their own reservations, and administrators can cancel any reservation.'
];

const deploymentRules = [
  'A valid target resource, image, and deployment time are required.',
  'Deployments should be scheduled before the experiment window begins.',
  'Deployments cannot overlap an existing reservation on the same resource.',
  'Operators should leave validation buffer time for reboot, provisioning, and software checks.'
];

const terminalChecks = [
  'User authentication is valid.',
  'A supported resource has been selected.',
  'The user has an active reservation, unless an administrator is overriding for maintenance.',
  'Terminal session safety and routing checks pass on the backend.'
];

const adminResponsibilities = [
  'Monitor users, reservations, and deployment activity.',
  'Cancel conflicting or invalid reservations when necessary.',
  'Maintain image availability and repeatable deployment baselines.',
  'Verify authentication, access control, and resource visibility behavior.'
];

const troubleshootingGroups = [
  {
    title: 'Physical Node Not Ready',
    items: [
      'Confirm the node has power and completed boot.',
      'Check that the radio is connected to the intended host.',
      'Verify management networking is reachable.',
      'Confirm the dashboard reflects the expected resource state.'
    ]
  },
  {
    title: 'Reservation Creation Fails',
    items: [
      'Project or purpose is missing.',
      'Start or end time is invalid.',
      'The reservation starts in the past.',
      'Another reservation already overlaps the same resource.',
      'The database or backend is unavailable.'
    ]
  },
  {
    title: 'Deployment Request Fails',
    items: [
      'No resource or image was selected.',
      'The deployment time is invalid.',
      'The deployment overlaps a reservation window.',
      'The database or backend is unavailable.'
    ]
  },
  {
    title: 'Terminal Access Is Denied',
    items: [
      'The user is not logged in.',
      'There is no active reservation for the selected resource.',
      'The selected resource is invalid or unavailable.',
      'A terminal session policy check was rejected.'
    ]
  }
];

const sectionPaperSx = {
  borderRadius: 4,
  border: '1px solid #d8e1ee',
  p: { xs: 3, md: 4 },
  background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
  scrollMarginTop: '96px'
} as const;

const renderBulletList = (items: string[]) => (
  <List dense disablePadding sx={{ pl: 0.5 }}>
    {items.map((item) => (
      <ListItem key={item} disableGutters sx={{ alignItems: 'flex-start', py: 0.45 }}>
        <ListItemText
          primary={item}
          primaryTypographyProps={{ variant: 'body1', color: 'text.primary', lineHeight: 1.65 }}
        />
      </ListItem>
    ))}
  </List>
);

const sections: DocSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'Platform Overview',
    description: 'This portal is the documentation and control surface for an open-source 5G Metal-as-a-Service testbed.',
    content: (
      <Stack spacing={3}>
        <Typography color="text.secondary" lineHeight={1.8}>
          The platform combines physical lab preparation, software provisioning, scheduling, and
          controlled terminal access into one workflow. It is intended for students, researchers,
          and administrators who need reproducible 5G experimentation on shared bare-metal
          infrastructure.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: '#f4f8fc', border: '1px solid #d8e1ee' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                What This Platform Covers
              </Typography>
              {renderBulletList(quickFacts)}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: '#f4f8fc', border: '1px solid #d8e1ee' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Core Portal Modules
              </Typography>
              {renderBulletList(platformModules)}
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    )
  },
  {
    id: 'architecture',
    label: 'Architecture',
    title: 'Testbed Architecture',
    description: 'The lab combines a centralized orchestration flow with distributed nodes and radio pairings inside the OS5G network segment.',
    content: (
      <Stack spacing={3}>
        <Typography color="text.secondary" lineHeight={1.8}>
          The topology centers on an OS5G subnet with multiple experiment nodes, a miscellaneous
          support node, and a login or orchestration node tied into the broader UCONN network. Each
          node can be assigned a lab role such as gNB, UE, core, sandbox, or validation host.
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={7}>
            <Box
              component="img"
              src={topologyDiagram}
              alt="UCONN 5G testbed topology showing OS5G subnet nodes, miscellaneous services node, login node, and relative node spacing."
              sx={{
                width: '100%',
                display: 'block',
                borderRadius: 3,
                border: '1px solid #d8e1ee',
                bgcolor: '#fff',
                p: 1.5
              }}
            />
          </Grid>
          <Grid item xs={12} lg={5}>
            <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: '#f4f8fc', border: '1px solid #d8e1ee', height: '100%' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Architecture Highlights
              </Typography>
              {renderBulletList(architectureHighlights)}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Topology Notes
              </Typography>
              <Typography color="text.secondary" lineHeight={1.8}>
                The uploaded diagram captures physical spacing between experiment nodes, including
                2-meter horizontal and vertical separation on the outer shape and roughly 1.4-meter
                spacing toward the center node. That makes it useful both as an operations map and
                as a reproducibility reference for future experiments.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    )
  },
  {
    id: 'setup',
    label: 'Physical Setup',
    title: 'Physical Testbed Setup',
    description: 'Lab readiness starts before any reservation is created, with node placement, cabling, timing, and image preparation.',
    content: (
      <Grid container spacing={2}>
        {physicalSetupSteps.map((step, index) => (
          <Grid item xs={12} md={6} key={step}>
            <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #d8e1ee', height: '100%' }}>
              <Typography variant="overline" sx={{ letterSpacing: '0.12em', color: '#54708d' }}>
                Step {index + 1}
              </Typography>
              <Typography lineHeight={1.8}>{step}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    )
  },
  {
    id: 'access',
    label: 'Access Flow',
    title: 'Access And Authentication',
    description: 'Researchers typically enter through Globus in production, with a controlled local flow reserved for internal staging.',
    content: (
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #d8e1ee', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Production Login
            </Typography>
            {renderBulletList([
              'Open the portal and choose the production sign-in path.',
              'The backend redirects the user to Globus.',
              'After a successful login, the user returns through /auth/callback.',
              'The backend forwards the user into the dashboard workflow.'
            ])}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #d8e1ee', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Controlled Local Login
            </Typography>
            <Typography color="text.secondary" lineHeight={1.8}>
              Local or demo login is intended for development, validation, and lab checks before
              production access is enabled. It should support internal testing rather than replace
              the production identity flow.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    )
  },
  {
    id: 'workflow',
    label: 'User Workflow',
    title: 'Recommended User Workflow',
    description: 'The cleanest operational flow is sign in, validate resources, reserve a node, deploy if needed, and use terminal access during the approved window.',
    content: (
      <Grid container spacing={2}>
        {[
          'Sign in to the portal.',
          'Review machine status on the dashboard.',
          'Create a reservation for the target PC.',
          'Queue image deployment before the reservation if a clean build is needed.',
          'Use terminal access only during the active reservation window.',
          'End the session and leave the resource ready for the next user.'
        ].map((step, index) => (
          <Grid item xs={12} sm={6} md={4} key={step}>
            <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #d8e1ee', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom color="#163a5a">
                {index + 1}
              </Typography>
              <Typography lineHeight={1.8}>{step}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    )
  },
  {
    id: 'reservations',
    label: 'Reservations',
    title: 'Reservation Procedure',
    description: 'Reservations define who can use a resource and when that access window is valid.',
    content: (
      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #d8e1ee', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Reservation Steps
            </Typography>
            {renderBulletList([
              'Open the Reservations module.',
              'Select the desired lab resource.',
              'Enter the project name and a short experiment purpose.',
              'Choose a future start time and an end time after the start.',
              'Submit the reservation and verify it appears in the schedule list.',
              'Cancel it later if the work is no longer needed.'
            ])}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #d8e1ee', bgcolor: '#f4f8fc', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Backend Rules
            </Typography>
            {renderBulletList(reservationRules)}
          </Paper>
        </Grid>
      </Grid>
    )
  },
  {
    id: 'deployments',
    label: 'Deployments',
    title: 'Deployment Scheduling',
    description: 'Image deployment prepares a machine with a known software stack before the experiment window begins.',
    content: (
      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #d8e1ee', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Deployment Flow
            </Typography>
            {renderBulletList([
              'Open the Image Deployment module.',
              'Choose a supported PC.',
              'Select an image such as an OAI gNB, OAI core, or sandbox baseline.',
              'Set a deployment time that finishes before the experiment window.',
              'Add optional notes for handoff, validation, or custom preparation.',
              'Queue the deployment and monitor follow-up validation.'
            ])}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #d8e1ee', bgcolor: '#f4f8fc', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Deployment Rules
            </Typography>
            {renderBulletList(deploymentRules)}
          </Paper>
        </Grid>
      </Grid>
    )
  },
  {
    id: 'terminal',
    label: 'Terminal Access',
    title: 'Terminal Access Policy',
    description: 'Terminal access is intentionally gated to protect shared resources and preserve reservation-based scheduling.',
    content: (
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #d8e1ee', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Session Workflow
            </Typography>
            {renderBulletList([
              'Confirm that a valid reservation is active for the current time window.',
              'Open the Terminal module.',
              'Start the session on the selected resource.',
              'Perform the approved experiment work during the reserved slot.',
              'End the terminal session cleanly through the portal.'
            ])}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #d8e1ee', bgcolor: '#f4f8fc', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Access Checks
            </Typography>
            {renderBulletList(terminalChecks)}
          </Paper>
        </Grid>
      </Grid>
    )
  },
  {
    id: 'operations',
    label: 'Operations',
    title: 'Admin Operations',
    description: 'Shared-lab reliability depends on active operational ownership, especially around scheduling conflicts, images, and access control.',
    content: (
      <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #d8e1ee', bgcolor: '#f4f8fc' }}>
        {renderBulletList(adminResponsibilities)}
      </Paper>
    )
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    title: 'Troubleshooting Guide',
    description: 'These are the first checks to perform when readiness, scheduling, deployment, or access breaks down.',
    content: (
      <Grid container spacing={2}>
        {troubleshootingGroups.map((group) => (
          <Grid item xs={12} md={6} key={group.title}>
            <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #d8e1ee', height: '100%' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {group.title}
              </Typography>
              {renderBulletList(group.items)}
            </Paper>
          </Grid>
        ))}
      </Grid>
    )
  }
];

const Docs: React.FC = () => {
  return (
    <Box mt={1} mb={6}>
      <Paper
        sx={{
          borderRadius: 5,
          overflow: 'hidden',
          border: '1px solid #d8e1ee',
          background: 'linear-gradient(135deg, #0f2744 0%, #17456a 52%, #f4f8fc 52%, #ffffff 100%)'
        }}
      >
        <Grid container>
          <Grid item xs={12} md={7}>
            <Box sx={{ p: { xs: 3, md: 5 }, color: '#fff' }}>
              <Chip
                label="Documentation"
                sx={{
                  width: 'fit-content',
                  bgcolor: 'rgba(255,255,255,0.14)',
                  color: '#fff',
                  fontWeight: 700
                }}
              />
              <Typography
                variant="h3"
                fontWeight={800}
                sx={{ mt: 2, maxWidth: 640, fontFamily: '"Cambria", "Times New Roman", serif' }}
              >
                Open-Source 5G Testbed Platform
              </Typography>
              <Typography sx={{ mt: 2, maxWidth: 680, color: 'rgba(255,255,255,0.84)', lineHeight: 1.85 }}>
                A structured operations guide for the UCONN 5G testbed, organized like a technical
                documentation portal. The content below groups the full platform story into
                architecture, setup, access, scheduling, operations, and troubleshooting.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 3 }}>
                <Chip label="Architecture" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
                <Chip label="Physical Setup" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
                <Chip label="Reservations" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
                <Chip label="Deployments" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
                <Chip label="Troubleshooting" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
              </Stack>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ p: { xs: 3, md: 5 }, height: '100%', display: 'flex', alignItems: 'center' }}>
              <Paper sx={{ p: 3, borderRadius: 4, width: '100%', border: '1px solid #d8e1ee' }}>
                <Typography variant="overline" sx={{ letterSpacing: '0.12em', color: '#54708d' }}>
                  At A Glance
                </Typography>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Recommended flow
                </Typography>
                {renderBulletList([
                  'Prepare nodes, radios, networking, and timing first.',
                  'Verify status in the dashboard before scheduling.',
                  'Reserve the resource and deploy an image if needed.',
                  'Use terminal access only inside the approved time window.'
                ])}
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              position: { md: 'sticky' },
              top: { md: 88 },
              p: 2.5,
              borderRadius: 4,
              border: '1px solid #d8e1ee',
              bgcolor: '#f8fbfe'
            }}
          >
            <Typography variant="overline" sx={{ letterSpacing: '0.12em', color: '#54708d' }}>
              On This Page
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {sections.map((section) => (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  underline="none"
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    color: '#163a5a',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#e7f0f8' }
                  }}
                >
                  {section.label}
                </Link>
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Source Coverage
            </Typography>
            <Typography variant="body2" color="text.secondary" lineHeight={1.75}>
              This page consolidates the supplied testbed documentation with the uploaded topology
              diagram into one categorized portal view.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Stack spacing={3}>
            {sections.map((section) => (
              <Paper key={section.id} id={section.id} sx={sectionPaperSx}>
                <Typography variant="overline" sx={{ letterSpacing: '0.12em', color: '#54708d' }}>
                  {section.label}
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, mb: 1, color: '#163a5a' }}>
                  {section.title}
                </Typography>
                {section.description && (
                  <Typography color="text.secondary" lineHeight={1.8} sx={{ mb: 3 }}>
                    {section.description}
                  </Typography>
                )}
                {section.content}
              </Paper>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Docs;
