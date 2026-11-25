package com.opentoilet.dto.response;

import com.opentoilet.entity.Toilet;

public record ToiletReferenceResponse(Long id, String name, String address) {

    public static ToiletReferenceResponse from(Toilet toilet) {
        return new ToiletReferenceResponse(toilet.getId(), toilet.getName(), toilet.getAddress());
    }
}
