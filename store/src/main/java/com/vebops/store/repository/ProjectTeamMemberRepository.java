package com.vebops.store.repository;

import com.vebops.store.model.ProjectTeamMember;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectTeamMemberRepository extends JpaRepository<ProjectTeamMember, Long> {
    List<ProjectTeamMember> findByProjectId(Long projectId);

    void deleteByProjectId(Long projectId);
}
