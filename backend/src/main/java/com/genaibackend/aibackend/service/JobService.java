package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.entity.Job;
import com.genaibackend.aibackend.model.User;
import com.genaibackend.aibackend.repository.JobRepository;
import com.genaibackend.aibackend.repository.OrganizationRepository;
import com.genaibackend.aibackend.repository.UserRepository;
import com.genaibackend.aibackend.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class JobService {

    private static final int MAX_JOBS_PER_ORG_PER_DAY = 50;

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final TenantContext tenantContext;

    public JobService(JobRepository jobRepository,
                      UserRepository userRepository,
                      OrganizationRepository organizationRepository,
                      TenantContext tenantContext) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.tenantContext = tenantContext;
    }

    @Transactional
    public String createJob(String username, String toolName, String inputData) {
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        String orgId = tenantContext.requireOrganizationId();

        // Sliding 24h quota, counted per ORGANIZATION: the allowance belongs to
        // the paying account, so teammates share it rather than each getting a
        // full quota of their own.
        //
        // KNOWN LIMITATION: this is still check-then-act. Two concurrent
        // requests can both read a count of 49 and both insert, briefly
        // exceeding the cap by the number of in-flight requests. Closing that
        // properly needs an atomic counter (Redis INCR) rather than a COUNT
        // query — scheduled for the rate-limiting rework.
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusDays(1);
        long jobsToday = jobRepository.countByOrganizationIdAndCreatedAtAfter(orgId, twentyFourHoursAgo);

        if (jobsToday >= MAX_JOBS_PER_ORG_PER_DAY) {
            throw new RuntimeException("Daily quota exceeded. Please try again tomorrow.");
        }

        Job job = new Job();
        job.setOrganization(organizationRepository.getReferenceById(orgId));
        job.setOwner(owner);
        job.setToolName(toolName);
        job.setInputData(inputData);
        job.setStatus(Job.JobStatus.CREATED);

        return jobRepository.save(job).getId();
    }

    /**
     * Drains the queue for the background worker. Not tenant-scoped by design:
     * the worker runs outside any request and processes every tenant's jobs,
     * reading the tenant off each row.
     */
    public List<Job> getPendingJobs() {
        return jobRepository.findByStatusOrderByCreatedAtAsc(Job.JobStatus.CREATED);
    }

    public void saveJob(Job job) {
        jobRepository.save(job);
    }

    /** Tenant-scoped read. Returns the same "not found" for another tenant's job. */
    @Transactional(readOnly = true)
    public Job getOwnedJob(String username, String id) {
        return jobRepository.findByIdAndOrganizationId(id, tenantContext.requireOrganizationId())
                .orElseThrow(() -> new RuntimeException("Job not found"));
    }
}
