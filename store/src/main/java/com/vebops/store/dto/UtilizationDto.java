package com.vebops.store.dto;

import java.util.Map;

public class UtilizationDto {
    public String contractorCode;
    public Map<String, Map<String, Double>> data; // labourCode -> { dateISO -> hours }
}
