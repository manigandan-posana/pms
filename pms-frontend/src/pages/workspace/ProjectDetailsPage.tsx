import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
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
} from "@mui/material";
import toast from "react-hot-toast";
import type { RootState, AppDispatch } from "../../store/store";
import {
  fetchProjectDetails,
  updateProjectTeam,
} from "../../store/slices/adminProjectsSlice";
import { searchUsers } from "../../store/slices/adminUsersSlice";
import CustomButton from "../../widgets/CustomButton";
import CustomLoader from "../../widgets/CustomLoader";

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

  const { currentProject, status, error } = useSelector(
    (state: RootState) => state.adminProjects
  );
  const users = useSelector((state: RootState) => (state as any).adminUsers?.items || []);

  const [activeTab, setActiveTab] = useState("team");
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(searchUsers({ page: 1, size: 200 }));
  }, [dispatch]);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectDetails(projectId));
    }
  }, [dispatch, projectId]);

  useEffect(() => {
    if (currentProject?.teamMembers) {
      const grouped: AssignmentMap = {};
      ROLE_OPTIONS.forEach((role) => {
        grouped[role.value] = [];
      });
      currentProject.teamMembers.forEach((member) => {
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
    () =>
      (users || []).map((user: any) => ({
        id: user.id?.toString?.() || user.id || user.email,
        label: user.name || user.email || `User ${user.id}`,
      })),
    [users]
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
      await dispatch(
        updateProjectTeam({ projectId: Number(projectId), assignments: payload })
      ).unwrap();
      toast.success("Project team updated successfully");
    } catch (err: any) {
      toast.error(err || "Unable to save team");
    } finally {
      setSaving(false);
    }
  };

  const renderTeamTab = () => (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {ROLE_OPTIONS.map((role) => (
        <Card key={role.value} variant="outlined" sx={{ borderRadius: 1 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={role.label} color={role.color} size="small" />
                <Typography variant="body2" color="text.secondary">
                  Assign users to this role
                </Typography>
              </Stack>
              <Autocomplete
                multiple
                options={availableUsers}
                getOptionLabel={(option) => option.label}
                value={assignments[role.value] || []}
                onChange={(_, value) =>
                  setAssignments((prev) => ({
                    ...prev,
                    [role.value]: value,
                  }))
                }
                renderInput={(params) => (
                  <TextField {...params} placeholder="Select users" size="small" />
                )}
                sx={{ minWidth: 320 }}
              />
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Box display="flex" justifyContent="flex-end" gap={1}>
        <CustomButton variant="outlined" onClick={() => navigate(-1)}>
          Back
        </CustomButton>
        <CustomButton onClick={handleSaveTeam} disabled={saving}>
          {saving ? "Saving..." : "Save Team"}
        </CustomButton>
      </Box>
    </Stack>
  );

  const renderDetailsTab = () => (
    <Card variant="outlined" sx={{ mt: 2, borderRadius: 1 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Project Name
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {currentProject?.name || "—"}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Project Code
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {currentProject?.code || "—"}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
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
    const grouped = ROLE_OPTIONS.map((role) => ({
      role,
      members: (currentProject?.teamMembers || []).filter(
        (member) => member.role === role.value
      ),
    }));

    return (
      <Card variant="outlined" sx={{ mt: 2, borderRadius: 1 }}>
        <CardContent>
          <Box
            sx={{
              position: "relative",
              px: { xs: 1, md: 2 },
              py: 1,
              "&:before": {
                content: '""',
                position: "absolute",
                left: 24,
                top: 12,
                bottom: 12,
                width: 2,
                bgcolor: "divider",
                opacity: 0.6,
              },
            }}
          >
            <Stack spacing={2} sx={{ position: "relative" }}>
              <Box sx={{ position: "relative", pl: 6 }}>
                <Box
                  sx={{
                    position: "absolute",
                    left: 16,
                    top: 16,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    boxShadow: 3,
                  }}
                />
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    background:
                      "linear-gradient(135deg, rgba(33,150,243,0.08), rgba(156,39,176,0.08))",
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Project
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {currentProject?.name || "Project"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {currentProject?.code}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {grouped.map(({ role, members }) => (
                <Box key={role.value} sx={{ position: "relative", pl: 6 }}>
                  <Box
                    sx={{
                      position: "absolute",
                      left: 16,
                      top: 22,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      bgcolor: (theme) =>
                        role.color === "primary"
                          ? theme.palette.primary.main
                          : role.color === "secondary"
                          ? theme.palette.secondary.main
                          : theme.palette.grey[500],
                      boxShadow: 2,
                    }}
                  />
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        alignItems={{ xs: "flex-start", md: "center" }}
                        justifyContent="space-between"
                        spacing={1}
                        mb={1}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={role.label} size="small" color={role.color} />
                          <Typography variant="caption" color="text.secondary">
                            {members.length} member{members.length === 1 ? "" : "s"}
                          </Typography>
                        </Stack>
                        <Divider flexItem orientation="horizontal" sx={{ display: { md: "none" } }} />
                      </Stack>

                      {members.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No users assigned to this role yet.
                        </Typography>
                      ) : (
                        <Grid container spacing={1.5}>
                          {members.map((member) => (
                            <Grid
                              item
                              xs={12}
                              sm={6}
                              md={4}
                              key={`${member.role}-${member.userId}-${member.id}`}
                            >
                              <Box
                                sx={{
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 2,
                                  p: 1.25,
                                  backgroundColor: (theme) =>
                                    theme.palette.mode === "light"
                                      ? "#f9fbff"
                                      : "rgba(255,255,255,0.03)",
                                  boxShadow: 1,
                                }}
                              >
                                <Typography variant="body2" fontWeight={700} noWrap>
                                  {member.userName || member.userEmail || "Unknown user"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {member.userEmail || ""}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h6" fontWeight={700} mb={1}>
        Project Details
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Manage team members, view project info, and explore the team hierarchy.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

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
        </>
      )}
    </Box>
  );
};

export default ProjectDetailsPage;
