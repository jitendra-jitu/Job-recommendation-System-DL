
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRecommendedJobs } from "@/services/api";
import JobCard from "@/components/JobCard";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useProfile } from "@/contexts/ProfileContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

const RecommendedJobs = () => {
  const { profile, isProfileComplete, refreshRecommendations } = useProfile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Function to manually refresh job recommendations
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshRecommendations();
      toast({
        title: "Success",
        description: "Job recommendations refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh job recommendations",
        variant: "destructive",
      });
      console.error("Error refreshing recommendations:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch job recommendations when component mounts
  useEffect(() => {
    if (isProfileComplete) {
      console.log("Component mounted - fetching initial recommendations");
      refreshRecommendations();
    }
  }, [isProfileComplete, refreshRecommendations]);

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ["recommendedJobs", profile.skills],
    queryFn: () => fetchRecommendedJobs(profile.skills),
    enabled: isProfileComplete,
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  if (!isProfileComplete) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          Complete Your Profile First
        </h1>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          We need more information about your skills and experience to provide personalized job recommendations.
        </p>
        <Button asChild>
          <Link to="/profile">Go to Profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Recommended Jobs
          </h1>
          <p className="text-gray-600">
            Personalized recommendations based on your profile
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Recommendations
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-4" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">Error loading job recommendations.</p>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No recommended jobs found for your profile.</p>
          <p className="text-gray-500 mb-6">Try adding more skills to your profile or refreshing recommendations.</p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link to="/profile">Update Profile</Link>
            </Button>
            <Button onClick={handleRefresh}>
              Refresh Recommendations
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} isRecommended={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendedJobs;
