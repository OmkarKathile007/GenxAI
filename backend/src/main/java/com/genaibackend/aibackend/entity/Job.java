package com.genaibackend.aibackend.entity;



import com.fasterxml.jackson.annotation.JsonIgnore;
import com.genaibackend.aibackend.model.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // The user who submitted this job. Every read of a job's input/response must
    // be scoped by this — a job holds the user's prompt text and the AI's answer.
    // Column is nullable so ddl-auto=update can add it to an existing jobs table;
    // JobService always sets it on create.
    // Never serialized: this entity is returned straight to the client from
    // /api/ai/job/{id}, and User carries the password hash. It is also LAZY with
    // open-in-view=false, so touching it during serialization would fail anyway.
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(nullable = false)
    private String toolName;

    @Column(columnDefinition = "TEXT")
    private String inputData;

    @Column(columnDefinition = "TEXT")
    private String responseData;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    private int tokenUsage; // How many tokens the AI used
    private double cost;

    //  No-Args Constructor (Required by JPA)
    public Job() {}

    //  Constructor for creating new jobs
    public Job(String toolName, String inputData, JobStatus status) {
        this.toolName = toolName;
        this.inputData = inputData;
        this.status = status;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = JobStatus.CREATED;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    @JsonIgnore
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public String getToolName() { return toolName; }
    public void setToolName(String toolName) { this.toolName = toolName; }

    public String getInputData() { return inputData; }
    public void setInputData(String inputData) { this.inputData = inputData; }

    public String getResponseData() { return responseData; }
    public void setResponseData(String responseData) { this.responseData = responseData; }

    public JobStatus getStatus() { return status; }
    public void setStatus(JobStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public int getTokenUsage() { return tokenUsage; }
    public void setTokenUsage(int tokenUsage) { this.tokenUsage = tokenUsage; }

    public double getCost() { return cost; }
    public void setCost(double cost) { this.cost = cost; }

    public enum JobStatus {
        CREATED, PROCESSING, COMPLETED, FAILED
    }
}