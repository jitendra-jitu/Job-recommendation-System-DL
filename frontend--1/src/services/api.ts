import { Job, Profile } from "../types/job";
import { toast } from "@/hooks/use-toast";

// Set the correct API endpoint
const API_BASE_URL = "http://localhost:5000";
const PREDICTION_ENDPOINT = "http://127.0.0.1:5000/predict";

export async function fetchSampleJobs(): Promise<Job[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/sample-jobs`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch jobs");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching sample jobs:", error);
    toast({
      title: "Error",
      description: "Failed to fetch jobs. Please try again.",
      variant: "destructive",
    });
    return [];
  }
}

export async function fetchRecommendedJobs(skills?: string[]): Promise<Job[]> {
  try {
    console.log("Fetching recommended jobs with skills:", skills);
    
    // Attempt to retrieve recommended jobs from cache
    const cachedJobs = localStorage.getItem("recommendedJobs");
    if (cachedJobs) {
      const jobs = JSON.parse(cachedJobs);
      console.log("Using cached recommended jobs:", jobs);
      return jobs.map((job: any, index: number) => ({
        ...job,
        id: job.id || index.toString(),
        confidenceScore: job.confidence || job.confidenceScore || 0
      }));
    }
    
    // If no cached jobs, return empty array (forcing a refresh)
    console.log("No cached recommended jobs found");
    return [];
  } catch (error) {
    console.error("Error fetching recommended jobs:", error);
    toast({
      title: "Error",
      description: "Failed to fetch recommended jobs. Please try again.",
      variant: "destructive",
    });
    return [];
  }
}

export async function requestRecommendedJobs(jobTitle: string, skillsString: string): Promise<Job[]> {
  try {
    if (!jobTitle || !skillsString) {
      throw new Error("Job title and skills are required for recommendations");
    }
    
    console.log("POST request to prediction endpoint:", PREDICTION_ENDPOINT);
    console.log("POST payload:", { job_title: jobTitle, key_skills: skillsString });
    
    // Prepare the request payload with the correct format
    const payload = {
      job_title: jobTitle,
      key_skills: skillsString
    };
    
    // Try to make an actual API call to the prediction endpoint
    try {
      const response = await fetch(PREDICTION_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        console.error("Error response from prediction API:", response.status);
        throw new Error(`Failed to get job recommendations: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received prediction data:", data);
      
      // Format the response data to match our Job structure
      const formattedJobs = Array.isArray(data) ? data.map((job, index) => ({
        ...job,
        id: index.toString(),
        confidenceScore: job.confidence || 0
      })) : [];
      
      // Cache the results
      localStorage.setItem("recommendedJobs", JSON.stringify(formattedJobs));
      
      return formattedJobs;
    } catch (apiError) {
      console.error("API call failed:", apiError);
      throw apiError; // Propagate error to caller
    }
  } catch (error) {
    console.error("Error requesting recommended jobs:", error);
    toast({
      title: "Error",
      description: "Failed to get job recommendations. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    toast({
      title: "Success",
      description: "Profile saved successfully!",
    });
  } catch (error) {
    console.error("Error saving profile:", error);
    toast({
      title: "Error",
      description: "Failed to save profile. Please try again.",
      variant: "destructive",
    });
  }
}

export function getProfile(): Profile | null {
  try {
    const profileData = localStorage.getItem("userProfile");
    if (profileData) {
      return JSON.parse(profileData);
    }
    return null;
  } catch (error) {
    console.error("Error retrieving profile:", error);
    return null;
  }
}

export async function parseResumeData(file: File): Promise<Profile> {
  try {
    const API_URL = "http://localhost:5000/upload-resume";
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to parse resume");
    }

    const data = await response.json();
    
    // Format the data to match our Profile structure
    return {
      fullName: data.full_name || "",
      email: data.email || "",
      skills: data.skills || [],
      experience: Array.isArray(data.experience) 
        ? data.experience.map((exp: any, index: number) => ({
            id: index.toString(),
            jobTitle: exp.job_title || "",
            company: exp.company || "",
            duration: exp.duration || "",
            description: exp.description || ""
          }))
        : [],
      education: Array.isArray(data.education)
        ? data.education.map((edu: any, index: number) => ({
            id: index.toString(),
            degree: edu.degree || "",
            institution: edu.institution || "",
            year: edu.year || ""
          }))
        : [],
      careerGoals: data.career_goals || "",
    };
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
}
