package com.example.seoulgo.character;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CharacterRepository extends JpaRepository<UserCharacter, Long> {
    Optional<UserCharacter> findByMemberId(Long memberId);
    boolean existsByMemberId(Long memberId);
}

