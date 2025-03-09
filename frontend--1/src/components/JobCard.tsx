
import React from "react";
import { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Building, Briefcase } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface JobCardProps {
  job: Job;
  isRecommended?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, isRecommended = false }) => {
  // Format display values from job object based on structure
  const title = job["Job Title"] || "";
  const company = 
    job.details?.Company || 
    job["Company"] || 
    job.details?.Industry || 
    job["Industry"] || 
    "";
  
  const salary = job.details?.["Job Salary"] || job["Job Salary"] || "";
  const experience = job.details?.["Job Experience Required"] || job["Job Experience Required"] || "";
  const description = job.details?.Description || job["Description"] || "";
  
  // Parse skills
  const skills = job["Key Skills"] ? 
    job["Key Skills"].split('|').map(s => s.trim()) : 
    [];

  // Get confidence score (from either property)
  const confidenceScore = job.confidence || job.confidenceScore || 0;

  const handleApply = () => {
    toast({
      title: "Application Submitted",
      description: "Your application has been successfully submitted!",
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {company && (
              <div className="flex items-center mt-1 text-sm text-gray-600">
                <Building className="h-4 w-4 mr-1" />
                <span>{company}</span>
              </div>
            )}
            {experience && (
              <div className="flex items-center mt-1 text-sm text-gray-600">
                <Briefcase className="h-4 w-4 mr-1" />
                <span>{experience}</span>
              </div>
            )}
          </div>
          {salary && (
            <div className="px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-medium">
              {salary}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {description && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">{description}</p>
        )}
        {skills.length > 0 && (
          <div className="flex flex-wrap mt-2 gap-1">
            {skills.slice(0, 3).map((skill) => (
              <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{skills.length - 3} more
              </span>
            )}
          </div>
        )}

        {isRecommended && confidenceScore > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Prediction Score</span>
              <span className="font-semibold">{confidenceScore.toFixed(4)}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full" 
                style={{ 
                  width: `${Math.round(confidenceScore * 100)}%`,
                  backgroundColor: getScoreColor(confidenceScore)
                }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button className="w-full" onClick={handleApply}>Apply Now</Button>
      </CardFooter>
    </Card>
  );
};

function getScoreColor(score: number): string {
  if (score >= 0.8) return "#10b981"; // green
  if (score >= 0.6) return "#2563eb"; // blue
  if (score >= 0.4) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

export default JobCard;
