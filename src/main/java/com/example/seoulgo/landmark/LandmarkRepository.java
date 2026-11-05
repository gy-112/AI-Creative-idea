package com.example.seoulgo.landmark;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface LandmarkRepository extends JpaRepository<Landmark, Long> {

    @Query("select l from Landmark l join fetch l.region order by l.region.id, l.id")
    List<Landmark> findAllWithRegion();

    List<Landmark> findByRegionId(Long regionId);
}
