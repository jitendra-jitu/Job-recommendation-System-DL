import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/contexts/ProfileContext";
import { saveProfile, parseResumeData } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { X, Plus, Upload } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { profile, setProfile, refreshRecommendations } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSkill = () => {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleAddExperience = () => {
    setProfile((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { id: uuidv4(), jobTitle: "", company: "", duration: "", description: "" },
      ],
    }));
  };

  const handleRemoveExperience = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  };

  const handleExperienceChange = (id: string, field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const handleAddEducation = () => {
    setProfile((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { id: uuidv4(), degree: "", institution: "", year: "" },
      ],
    }));
  };

  const handleRemoveEducation = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  const handleEducationChange = (id: string, field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      saveProfile(profile);
      await refreshRecommendations();
      navigate("/recommended-jobs");
      toast({
        title: "Profile Saved",
        description: "Your profile has been updated and job recommendations refreshed.",
      });
    } catch (error) {
      console.error("Profile save failed:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearProfile = () => {
    setProfile({
      fullName: "",
      email: "",
      skills: [],
      experience: [],
      education: [],
      careerGoals: "",
    });
    toast({
      title: "Profile Cleared",
      description: "All profile information has been cleared.",
    });
  };

  const handleResumeUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsParsingResume(true);
      try {
        const parsedData = await parseResumeData(file);
        setProfile(parsedData);
        toast({
          title: "Resume Parsed Successfully",
          description: "Your profile has been updated with information from your resume.",
        });
      } catch (error) {
        toast({
          title: "Error Parsing Resume",
          description: "There was an error parsing your resume. Please try again or fill the form manually.",
          variant: "destructive",
        });
      } finally {
        setIsParsingResume(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Your Profile</h1>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleClearProfile}
          >
            Clear Profile
          </Button>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-lg font-medium mb-1">Upload Your Resume</h3>
              <p className="text-sm text-gray-500 text-center mb-3">
                Upload your PDF resume to automatically fill your profile information
              </p>
              <input
                type="file"
                accept=".pdf"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button 
                onClick={handleResumeUpload}
                disabled={isParsingResume}
                variant="secondary"
                size="sm"
              >
                {isParsingResume ? "Processing..." : "Upload Resume"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="johndoe@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="skills">Skills</Label>
                <div className="flex gap-2">
                  <Input
                    id="skills"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add a skill"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddSkill} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-gray-500 hover:text-gray-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Experience</Label>
                {profile.experience.map((exp) => (
                  <div key={exp.id} className="p-3 border rounded-md relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(exp.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={exp.jobTitle}
                        onChange={(e) => handleExperienceChange(exp.id, "jobTitle", e.target.value)}
                        placeholder="Job Title"
                        className="mb-2"
                      />
                      <Input
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(exp.id, "company", e.target.value)}
                        placeholder="Company"
                        className="mb-2"
                      />
                    </div>
                    <Input
                      value={exp.duration}
                      onChange={(e) => handleExperienceChange(exp.id, "duration", e.target.value)}
                      placeholder="Duration (e.g., 2020-2022)"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleAddExperience}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Experience
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Education</Label>
                {profile.education.map((edu) => (
                  <div key={edu.id} className="p-3 border rounded-md relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(edu.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(edu.id, "degree", e.target.value)}
                        placeholder="Degree"
                        className="mb-2"
                      />
                      <Input
                        value={edu.institution}
                        onChange={(e) => handleEducationChange(edu.id, "institution", e.target.value)}
                        placeholder="Institution"
                        className="mb-2"
                      />
                    </div>
                    <Input
                      value={edu.year}
                      onChange={(e) => handleEducationChange(edu.id, "year", e.target.value)}
                      placeholder="Year"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleAddEducation}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Education
                </Button>
              </div>

              <div className="space-y-1">
                <Label htmlFor="careerGoals">Career Goals</Label>
                <Textarea
                  id="careerGoals"
                  value={profile.careerGoals}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      careerGoals: e.target.value,
                    }))
                  }
                  placeholder="Describe your career goals"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default Profile;
