
import React from "react";
import { Link } from "react-router-dom";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { isProfileComplete } = useProfile();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Job Recommendation System using CNN
          </h1>
          
          <div className="mt-6">
            <Button 
              size="lg" 
              variant={isProfileComplete ? "default" : "outline"}
              className={`text-lg px-6 ${
                !isProfileComplete ? "border-dashed" : ""
              }`}
              asChild
            >
              <Link to={"/profile"}>
                {isProfileComplete ? "View Your Profile" : "Complete Your Profile"}
              </Link>
            </Button>
          </div>

          {!isProfileComplete && (
            <p className="mt-4 text-sm text-gray-500">
              Please complete your profile to get personalized job recommendations
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
