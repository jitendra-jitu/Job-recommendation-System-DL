import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSampleJobs } from "@/services/api";
import JobCard from "@/components/JobCard";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Job } from "@/types/job";

const AllJobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ["sampleJobs"],
    queryFn: fetchSampleJobs,
  });

  const filteredJobs = jobs.filter((job: Job) => {
    // Get values, handling both possible structures
    const title = job["Job Title"] || "";
    const company = job["Company"] || job.details?.Company || job["Industry"] || job.details?.Industry || "";
    const skills = job["Key Skills"] || "";
    const description = job["Description"] || job.details?.Description || "";
    
    const searchLower = searchQuery.toLowerCase();
    return (
      title.toLowerCase().includes(searchLower) ||
      company.toLowerCase().includes(searchLower) ||
      skills.toLowerCase().includes(searchLower) ||
      description.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Available Jobs
        </h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Search jobs by title, company, or skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">Error loading jobs</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No jobs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job: Job, index: number) => (
            <JobCard key={job.id || index.toString()} job={{...job, id: job.id || index.toString()}} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllJobs;
