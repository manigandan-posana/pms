package com.vebops.store.repository;

import com.vebops.store.model.Supplier;
import com.vebops.store.model.SupplierType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findByProjectsId(Long projectId);

    List<Supplier> findByProjectsIdAndSupplierType(Long projectId, SupplierType supplierType);
}
