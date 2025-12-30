import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Get } from "../../utils/apiService";
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  MdAdd as AddIcon,
  MdDeleteOutline as DeleteIcon,
  MdClose as CloseIcon,
} from "react-icons/md";
import toast from "react-hot-toast";
import type { RootState, AppDispatch } from "../../store/store";
import {
  fetchProjectDetails,
  fetchUserProjectDetails,
  updateProjectTeam,
  updateUserProjectTeam,
} from "../../store/slices/adminProjectsSlice";
import { searchUsers } from "../../store/slices/adminUsersSlice";
import CustomButton from "../../widgets/CustomButton";
import CustomLoader from "../../widgets/CustomLoader";
import BomPage from "./BomPage";

type RoleValue =
  | "DEPUTY_PROJECT_MANAGER"
  | "PROCUREMENT"
  | "FINANCE"
  | "ADMIN"
  | "STORES"
  | "QUALITY"
  | "SUPERVISORS"
  | "OTHERS";

const ROLE_OPTIONS: { value: RoleValue; label: string; color: "primary" | "secondary" | "default" }[] = [
  { value: "DEPUTY_PROJECT_MANAGER", label: "Deputy Project Manager", color: "primary" },
  { value: "PROCUREMENT", label: "Procurement", color: "secondary" },
  { value: "FINANCE", label: "Finance", color: "primary" },
  { value: "ADMIN", label: "Admin", color: "secondary" },
  { value: "STORES", label: "Stores", color: "primary" },
  { value: "QUALITY", label: "Quality", color: "secondary" },
  { value: "SUPERVISORS", label: "Supervisors", color: "primary" },
  { value: "OTHERS", label: "Others", color: "default" },
];

const tabConfig = [
  { value: "team", label: "Project Team" },
  { value: "details", label: "Project Details" },
  { value: "tree", label: "Project Team Tree" },
  { value: "bom", label: "Bill of Materials" },
];

interface UserOption {
  id: string;
  label: string;
}

interface AssignmentMap {
  [role: string]: UserOption[];
}

const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const { name: userName, email: userEmail, role: userRole } = useSelector((state: RootState) => state.auth);

  const { currentProject, status, error } = useSelector(
    (state: RootState) => state.adminProjects
  );
  const users = useSelector((state: RootState) => (state as any).adminUsers?.items || []);

  const [activeTab, setActiveTab] = useState("team");
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [saving, setSaving] = useState(false);
  const [localUsers, setLocalUsers] = useState<UserOption[]>([]);

  // State for the "Add User" dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<RoleValue | null>(null);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<UserOption[]>([]);

  useEffect(() => {
    if (isAdmin) {
      dispatch(searchUsers({ page: 1, size: 200 }));
    } else {
      // Fetch app users for non-admin mode
      const fetchAppUsers = async () => {
        try {
          // Pass empty query to get all/top users
          const res = await Get<any[]>("/app/users/search?query=");
          const opts = res.map((u) => ({ id: String(u.id), label: u.name || u.email }));
          setLocalUsers(opts);
        } catch (e) { console.error("Failed to load users", e); }
      };
      fetchAppUsers();
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    if (projectId) {
      if (isAdmin) {
        dispatch(fetchProjectDetails(projectId));
      } else {
        dispatch(fetchUserProjectDetails(projectId));
      }
    }
  }, [dispatch, projectId, isAdmin]);

  useEffect(() => {
    if (currentProject?.teamMembers) {
      const grouped: AssignmentMap = {};
      ROLE_OPTIONS.forEach((role) => {
        grouped[role.value] = [];
      });
      currentProject.teamMembers.forEach((member: any) => {
        const option: UserOption = {
          id: member.userId || member.id || "",
          label: member.userName || member.userEmail || "Unknown user",
        };
        const roleKey = member.role as RoleValue;
        grouped[roleKey] = [...(grouped[roleKey] || []), option];
      });
      setAssignments(grouped);
    }
  }, [currentProject]);

  const availableUsers: UserOption[] = useMemo(
    () => {
      if (isAdmin) {
        return (users || []).map((user: any) => ({
          id: user.id?.toString?.() || user.id || user.email,
          label: user.name || user.email || `User ${user.id}`,
        }));
      }
      return localUsers;
    },
    [users, localUsers, isAdmin]
  );

  const handleSaveTeam = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      const payload = ROLE_OPTIONS.flatMap((role) =>
        (assignments[role.value] || []).map((user) => ({
          userId: Number(user.id),
          role: role.value,
        }))
      );
      if (isAdmin) {
        await dispatch(
          updateProjectTeam({ projectId: Number(projectId), assignments: payload })
        ).unwrap();
      } else {
        await dispatch(
          updateUserProjectTeam({ projectId: Number(projectId), assignments: payload })
        ).unwrap();
      }
      toast.success("Project team updated successfully");
    } catch (err: any) {
      toast.error(err || "Unable to save team");
    } finally {
      setSaving(false);
    }
  };

  // --- Actions ---

  const handleAddClick = (role: RoleValue) => {
    setTargetRole(role);
    setSelectedUsersToAdd([]);
    setAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setAddDialogOpen(false);
    setTargetRole(null);
    setSelectedUsersToAdd([]);
  };

  const handleConfirmAdd = () => {
    if (targetRole && selectedUsersToAdd.length > 0) {
      setAssignments((prev) => {
        const existing = prev[targetRole] || [];
        // Prevent duplicates
        const newUsers = selectedUsersToAdd.filter(
          (u) => !existing.some((ex) => ex.id === u.id)
        );
        return {
          ...prev,
          [targetRole]: [...existing, ...newUsers],
        };
      });
    }
    handleCloseDialog();
  };

  const handleRemoveUser = (role: RoleValue, userId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [role]: (prev[role] || []).filter((u) => u.id !== userId),
    }));
  };

  const renderTeamTab = () => {
    const isPM = currentProject?.projectManager && (
      (userName && currentProject.projectManager?.toLowerCase() === userName.toLowerCase()) ||
      (userEmail && currentProject.projectManager?.toLowerCase() === userEmail.toLowerCase())
    );
    const canEdit = isAdmin || isPM || userRole === "ADMIN";

    return (
      <Box sx={{ mt: 2 }}>
        {/* Save button remains as the "Commit" action */}
        {canEdit && (
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <CustomButton onClick={handleSaveTeam} disabled={saving}>
              {saving ? "Saving..." : "Save Team Changes"}
            </CustomButton>
          </Box>
        )}

        <Grid container spacing={2}>
          {ROLE_OPTIONS.map((role) => {
            const assignedUsers = assignments[role.value] || [];

            return (
              <Grid size={{ xs: 12, md: 6, lg: 3 }} key={role.value}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    boxShadow: 1,
                    borderColor: 'divider',
                  }}
                >
                  {/* Header */}
                  <Box sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'background.paper'
                  }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {role.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assignedUsers.length} Member{assignedUsers.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>

                    {canEdit && (
                      <IconButton
                        size="small"
                        onClick={() => handleAddClick(role.value)}
                        sx={{
                          bgcolor: `${role.color}.lighter`,
                          color: `${role.color}.main`,
                          '&:hover': { bgcolor: `${role.color}.light` }
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                    )}
                  </Box>

                  {/* Body - Fixed Height List */}
                  <CardContent sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
                    <Box sx={{
                      height: 280, // Fixed height ~5 rows
                      overflowY: 'auto',
                      bgcolor: '#fafafa'
                    }}>
                      {assignedUsers.length === 0 ? (
                        <Box
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          justifyContent="center"
                          height="100%"
                          color="text.secondary"
                          p={2}
                          textAlign="center"
                        >
                          <Typography variant="body2">No active members</Typography>
                          {canEdit && (
                            <Button
                              size="small"
                              sx={{ mt: 1, textTransform: 'none' }}
                              startIcon={<AddIcon />}
                              onClick={() => handleAddClick(role.value)}
                            >
                              Assign User
                            </Button>
                          )}
                        </Box>
                      ) : (
                        <Stack divider={<Divider />}>
                          {assignedUsers.map((user) => (
                            <Box
                              key={user.id}
                              sx={{
                                p: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              <Stack direction="row" spacing={1.5} alignItems="center" overflow="hidden">
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    fontSize: '0.85rem',
                                    bgcolor: role.color ? `${role.color}.light` : 'grey.300',
                                    color: role.color ? `${role.color}.main` : 'grey.800'
                                  }}
                                >
                                  {user.label.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box overflow="hidden">
                                  <Typography variant="body2" fontWeight={600} noWrap>
                                    {user.label}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                                    ID: {user.id}
                                  </Typography>
                                </Box>
                              </Stack>

                              {canEdit && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveUser(role.value, user.id)}
                                  sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Add User Dialog */}
        <Dialog open={addDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Add {targetRole ? ROLE_OPTIONS.find(r => r.value === targetRole)?.label : 'User'}
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Autocomplete
              multiple
              options={availableUsers}
              getOptionLabel={(option) => option.label}
              value={selectedUsersToAdd}
              onChange={(_, value) => setSelectedUsersToAdd(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search and select users..."
                  fullWidth
                  autoFocus
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
            <Button onClick={handleConfirmAdd} variant="contained" disabled={selectedUsersToAdd.length === 0}>
              Add Selected
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  const renderDetailsTab = () => (
    <Card variant="outlined" sx={{ mt: 2, borderRadius: 1 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Project Name
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {currentProject?.name || "—"}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Project Code
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {currentProject?.code || "—"}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Project Manager
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {currentProject?.projectManager || "—"}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderTreeTab = () => {
    // 1. Prepare Data
    // Group members by role
    const grouped = ROLE_OPTIONS.map((role) => ({
      role,
      members: (currentProject?.teamMembers || []).filter(
        (member: any) => member.role === role.value
      ),
    })).filter((g) => g.members.length > 0); // Only show roles with members

    // 2. Tree Components
    const NodeCard = ({ title, subtitle, roleLabel, color }: any) => (
      <Card
        variant="outlined"
        sx={{
          minWidth: 200,
          maxWidth: 240,
          borderRadius: 2,
          boxShadow: 2,
          bgcolor: "background.paper",
          position: "relative",
          zIndex: 2,
        }}
      >
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: color ? `${color}.light` : "grey.200",
                color: color ? `${color}.main` : "grey.700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "1rem",
              }}
            >
              {title ? title.charAt(0).toUpperCase() : "?"}
            </Box>
            <Box flex={1} minWidth={0}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                {subtitle}
              </Typography>
              {roleLabel && (
                <Chip
                  label={roleLabel}
                  size="small"
                  sx={{
                    mt: 0.5,
                    height: 18,
                    fontSize: "0.65rem",
                    bgcolor: "grey.100",
                  }}
                />
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );

    // If no data
    if (!currentProject) return null;

    return (
      <Box
        sx={{
          mt: 4,
          pb: 4,
          overflowX: "auto",
          display: "flex",
          justifyContent: "center",
          minHeight: 500,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Level 1: Project Manager (Root) */}
          <Box sx={{ position: "relative", mb: 4 }}>
            <NodeCard
              title={currentProject.projectManager || "Unassigned"}
              subtitle="Project Manager"
              color="primary"
            />
            {/* Vertical Line Down from Root */}
            {grouped.length > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: -32, // extend down to the horizontal connector
                  left: "50%",
                  width: 2,
                  height: 32,
                  bgcolor: "text.disabled", // Line color
                  opacity: 0.4,
                  transform: "translateX(-50%)",
                }}
              />
            )}
          </Box>

          {/* Level 2: Roles (Horizontal Distribution) */}
          {grouped.length > 0 && (
            <Box sx={{ position: "relative", display: "flex", gap: 4, alignItems: "flex-start" }}>
              {/* Horizontal Connecting Line */}
              {/* Spans from center of first child to center of last child */}
              <Box
                sx={{
                  position: "absolute",
                  top: -32, // Matches the bottom of the vertical line from root
                  left: 0,
                  right: 0,
                  height: 20, // Vertical drop to children
                  // This box acts as the bridge. We need logic to draw the top border explicitly.
                  // Simpler visual: A line spanning the *actual* width of the children's centers. 
                  // But simpler CSS approach: 
                  // Use a pseudo container for the children. 
                }}
              />

              {/* We need a detailed line drawing strategy. 
                  Strategy: 
                  For each group, we have a vertical line UP to a common horizontal track.
                  The horizontal track connects all vertical UP lines.
                  The Root's vertical DOWN line meets the horizontal track.
              */}

              {/* Visual Connector: The Horizontal Bar */}
              {/* Width needs to be calculated or logically placed. 
                  Hack: An absolute div positioned at top:-20px with borderTop.
                  Left/Right offsets need to align with the first and last item centers.
              */}
              {grouped.length > 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: -32, // Aligns with the end of the root's down line
                    left: "10%", // Approximation: Real centering is hard with just CSS unless we assume equal widths.
                    // A better CSS Flex tree approach:
                    // Every child item has a "before" pseudo elements that connects up.
                  }}
                />
              )}

              {/* Render Each Role Group */}
              {grouped.map((group, index) => {
                // Determine connection styles
                const isFirst = index === 0;
                const isLast = index === grouped.length - 1;
                const isOnly = grouped.length === 1;

                return (
                  <Box
                    key={group.role.value}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      position: "relative",
                      // Connecting Lines Logic (The "Bracket")
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: -32,
                        height: 32,
                        borderTop: !isOnly ? "2px solid" : "none",
                        borderColor: "rgba(0, 0, 0, 0.12)",
                        left: isFirst ? "50%" : 0,
                        right: isLast ? "50%" : 0,
                        width: "auto",
                      },
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        top: -32,
                        left: "50%",
                        width: 2,
                        height: 32,
                        bgcolor: "rgba(0, 0, 0, 0.12)",
                        transform: "translateX(-50%)",
                      },
                    }}
                  >
                    {/* The "Node" for this Group - Dashed Box */}
                    <Box
                      sx={{
                        border: "2px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 2,
                        pt: 3, // space for label
                        position: "relative",
                        bgcolor: "rgba(249, 250, 251, 0.5)", // very light bg
                        minWidth: 260,
                      }}
                    >
                      {/* Group Label */}
                      <Chip
                        label={group.role.label}
                        size="small"
                        color={group.role.color as any}
                        sx={{
                          position: "absolute",
                          top: -12,
                          left: 16,
                          fontWeight: 700,
                          border: "4px solid #fff", // mask the dashed line behind
                        }}
                      />

                      {/* Members Tree */}
                      {/* If multiple members, how to layout? Vertical or grid?
                          Image implies vertical stack per group or small grid.
                          Let's do a vertical stack for simplicity inside the group. 
                      */}
                      <Stack spacing={2}>
                        {group.members.map((member: any) => (
                          <NodeCard
                            key={member.id || member.userId}
                            title={member.userName || member.userEmail}
                            subtitle={member.userEmail}
                            // roleLabel={group.role.label} // redundant
                            color={group.role.color}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Box
          onClick={() => navigate(-1)}
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          <Typography variant="h6" component="span" sx={{ mr: 1 }}>←</Typography>
        </Box>
        <Typography variant="h6" fontWeight={700}>
          Project Details
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Manage team members, view project info, and explore the team hierarchy.
      </Typography>



      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        {tabConfig.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} />
        ))}
      </Tabs>

      {status === "loading" && (
        <Box display="flex" justifyContent="center" mt={3}>
          <CustomLoader />
        </Box>
      )}

      {status !== "loading" && (
        <>
          {activeTab === "team" && renderTeamTab()}
          {activeTab === "details" && renderDetailsTab()}
          {activeTab === "tree" && renderTreeTab()}
          {activeTab === "bom" && (
            <Box sx={{ mt: 2 }}>
              <BomPage projectId={projectId} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ProjectDetailsPage;
