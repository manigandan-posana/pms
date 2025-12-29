package com.vebops.store.repository;

import com.vebops.store.model.ProjectTeamMember;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectTeamMemberRepository extends JpaRepository<ProjectTeamMember, Long> {
    List<ProjectTeamMember> findByProject_Id(Long projectId);

    void deleteByProject_Id(Long projectId);

    boolean existsByProject_IdAndUser_Id(Long projectId, Long userId);

    List<ProjectTeamMember> findByUser_Id(Long userId);
}
