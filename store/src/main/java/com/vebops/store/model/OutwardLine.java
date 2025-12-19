package com.vebops.store.model;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "outward_lines")
public class OutwardLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "record_id")
    private OutwardRecord record;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id")
    private Material material;

    private double issueQty;

    public Long getId() {
        return id;
    }

    public OutwardRecord getRecord() {
        return record;
    }

    public void setRecord(OutwardRecord record) {
        this.record = record;
    }

    public Material getMaterial() {
        return material;
    }

    public void setMaterial(Material material) {
        this.material = material;
    }

    public double getIssueQty() {
        return issueQty;
    }

    public void setIssueQty(double issueQty) {
        this.issueQty = issueQty;
    }
}
