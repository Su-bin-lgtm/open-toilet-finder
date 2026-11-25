package com.opentoilet.repository;

import com.opentoilet.entity.Toilet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

@Repository
public interface ToiletRepository extends JpaRepository<Toilet, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Toilet t WHERE t.id = :id")
    Optional<Toilet> findByIdForUpdate(@Param("id") Long id);

    // 사각 영역(Bounding Box) 내 화장실 1차 고속 검색
    @Query("SELECT t FROM Toilet t " +
           "WHERE t.latitude BETWEEN :minLat AND :maxLat " +
           "AND t.longitude BETWEEN :minLng AND :maxLng")
    List<Toilet> findWithinBoundingBox(
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng,
            @Param("maxLng") Double maxLng
    );

    // 시설명, 분류, 도로명 및 지번 주소를 대상으로 검색
    @Query("SELECT t FROM Toilet t WHERE " +
            "LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(t.address) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(COALESCE(t.lotAddress, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(COALESCE(t.facilityType, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Toilet> searchByKeyword(@Param("keyword") String keyword);

    boolean existsByNameAndAddressAndLatitudeAndLongitude(String name, String address, Double latitude, Double longitude);
}
