package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.entity.Job;
import com.genaibackend.aibackend.model.User;
import com.genaibackend.aibackend.repository.JobRepository;
import com.genaibackend.aibackend.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class JobService {

    private static final int MAX_JOBS_PER_USER_PER_DAY = 50;

    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    // Explicit Constructor for Dependency Injection
    public JobService(JobRepository jobRepository, UserRepository userRepository) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
    }

    public String createJob(String username, String toolName, String inputData) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        // SAFETY CHECK: sliding 24h quota, counted PER USER so one account cannot
        // exhaust the AI allowance for everybody else.
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusDays(1);
        long jobsToday = jobRepository.countByOwnerUsernameAndCreatedAtAfter(username, twentyFourHoursAgo);

        if (jobsToday >= MAX_JOBS_PER_USER_PER_DAY) {
            throw new RuntimeException("Daily quota exceeded. Please try again tomorrow.");
        }
        Job job = new Job();
        job.setOwner(owner);
        job.setToolName(toolName);
        job.setInputData(inputData);
        job.setStatus(Job.JobStatus.CREATED);

        return jobRepository.save(job).getId();
    }

    public List<Job> getPendingJobs() {
//        return jobRepository.findByStatus(Job.JobStatus.CREATED);
        return jobRepository.findByStatusOrderByCreatedAtAsc(Job.JobStatus.CREATED);
    }

    public void saveJob(Job job) {
        jobRepository.save(job);
    }

    /** Ownership-scoped read. Returns the same "not found" for another user's job. */
    public Job getOwnedJob(String username, String id) {
        return jobRepository.findByIdAndOwnerUsername(id, username)
                .orElseThrow(() -> new RuntimeException("Job not found"));
    }
}