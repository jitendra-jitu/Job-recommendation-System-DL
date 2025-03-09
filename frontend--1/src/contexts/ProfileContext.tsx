
import React, { createContext, useContext, useState, useEffect } from "react";
import { Profile } from "../types/job";
import { requestRecommendedJobs } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileContextType {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  isProfileComplete: boolean;
  refreshRecommendations: () => Promise<void>;
}

const defaultProfile: Profile = {
  fullName: "",
  email: "",
  skills: [],
  experience: [],
  education: [],
  careerGoals: "",
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(() => {
    const savedProfile = localStorage.getItem("userProfile");
    return savedProfile ? JSON.parse(savedProfile) : defaultProfile;
  });
  const queryClient = useQueryClient();

  const isProfileComplete = Boolean(
    profile.fullName && 
    profile.email && 
    profile.skills.length > 0
  );

  const refreshRecommendations = async () => {
    if (!isProfileComplete) return;
    
    try {
      console.log("Refreshing recommendations with profile:", profile);
      
      // Get the most recent job title from experience or use a default
      const mostRecentJob = profile.experience && profile.experience.length > 0 
        ? profile.experience[0].jobTitle 
        : "Software Developer"; // Fallback job title
      
      console.log("Using job title:", mostRecentJob);
      console.log("Using skills:", profile.skills);
      
      // Format skills as pipe-separated string for the API
      const skillsString = profile.skills.join("|");
      
      // Make the API request with the user's job title and skills
      await requestRecommendedJobs(mostRecentJob, skillsString);
      
      // Invalidate the query to force a refetch
      queryClient.invalidateQueries({ queryKey: ["recommendedJobs"] });
    } catch (error) {
      console.error("Failed to refresh recommendations:", error);
      throw error; // Propagate the error for handling in the component
    }
  };

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
  }, [profile]);

  return (
    <ProfileContext.Provider value={{ 
      profile, 
      setProfile, 
      isProfileComplete,
      refreshRecommendations 
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
