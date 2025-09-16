import { useState, useEffect } from "react";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import JobCard from "@/components/molecules/JobCard";
import ApplicationCard from "@/components/molecules/ApplicationCard";
import { useRole } from "@/hooks/useRole";
import jobService from "@/services/api/jobService";
import applicationService from "@/services/api/applicationService";
import candidateService from "@/services/api/candidateService";
import savedJobsService from "@/services/api/savedJobsService";
import taskService from "@/services/api/taskService";
const Dashboard = () => {
  const { currentRole } = useRole();
  const [dashboardData, setDashboardData] = useState({
    stats: {},
recentJobs: [],
    recentApplications: [],
    recentTasks: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboardData = async () => {
    try {
      setError("");
      setLoading(true);

if (currentRole === "candidate") {
        const [jobs, applications, savedJobsCount, taskStats] = await Promise.all([
          jobService.getAll(),
          applicationService.getAll(),
          savedJobsService.getCount(),
          taskService.getStats()
        ]);

        const recentJobs = jobs.slice(0, 3);
        const myApplications = applications.slice(0, 3);
        const recentTasks = (await taskService.getAll()).slice(0, 3);

        setDashboardData({
          stats: {
            totalJobs: jobs.filter(j => j.status === "Active").length,
            savedJobs: savedJobsCount,
            myApplications: applications.length,
            interviews: applications.filter(a => a.status === "Interview").length,
            offers: applications.filter(a => a.status === "Offer").length,
            totalTasks: taskStats.total,
            pendingTasks: taskStats.new + taskStats.inProgress,
            completedTasks: taskStats.completed
          },
          recentJobs,
          recentApplications: myApplications,
          recentTasks
        });
      } else {
        const [jobs, applications, candidates, taskStats] = await Promise.all([
          jobService.getAll(),
          applicationService.getAll(),
          candidateService.getAll(),
          taskService.getStats()
        ]);

        const myJobs = jobs.slice(0, 3);
        const recentApplications = applications.slice(0, 3);
        const recentTasks = (await taskService.getAll()).slice(0, 3);

        setDashboardData({
          stats: {
            activeJobs: jobs.filter(j => j.status === "Active").length,
            totalApplications: applications.length,
            candidates: candidates.length,
            interviews: applications.filter(a => a.status === "Interview").length,
            totalTasks: taskStats.total,
            pendingTasks: taskStats.new + taskStats.inProgress,
            completedTasks: taskStats.completed
          },
          recentJobs: myJobs,
          recentApplications,
          recentTasks
        });
      }
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentRole]);

  if (loading) return <Loading rows={6} />;
  if (error) return <Error message={error} onRetry={loadDashboardData} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentRole === "candidate" ? "Your Job Search Dashboard" : "Recruiter Dashboard"}
          </h1>
          <p className="text-gray-600">
            {currentRole === "candidate" 
              ? "Track your applications and discover new opportunities" 
              : "Manage your job postings and review candidates"
            }
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(dashboardData.stats).map(([key, value]) => (
          <div key={key} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center">
                <ApperIcon 
name={
                    key.includes("Job") || key.includes("job") ? "Briefcase" :
                    key.includes("Application") || key.includes("application") ? "FileText" :
                    key.includes("Interview") || key.includes("interview") ? "Users" :
                    key.includes("Candidate") || key.includes("candidate") ? "User" :
                    key.includes("Offer") || key.includes("offer") ? "Gift" :
                    key.includes("Task") || key.includes("task") ? "List" :
                    "TrendingUp"
                  }
                  className="w-6 h-6 text-primary" 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

{/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentRole === "candidate" ? "Latest Job Opportunities" : "Your Recent Job Postings"}
            </h2>
            <button className="text-sm text-primary font-medium hover:underline">
              View All
            </button>
          </div>

          {dashboardData.recentJobs.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentJobs.map((job) => (
                <div key={job.Id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-1">{job.title}</h3>
                  <p className="text-sm text-primary mb-2">{job.company}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>${job.salaryRange?.min?.toLocaleString()} - ${job.salaryRange?.max?.toLocaleString()}</span>
                    <span>{job.applications?.length || 0} applications</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon="Briefcase"
              title="No recent jobs"
              message={currentRole === "candidate" ? "New job opportunities will appear here" : "Your job postings will appear here"}
            />
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentRole === "candidate" ? "Your Recent Applications" : "Latest Applications"}
            </h2>
            <button className="text-sm text-primary font-medium hover:underline">
              View All
            </button>
          </div>

          {dashboardData.recentApplications.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentApplications.map((application) => (
                <div key={application.Id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {currentRole === "candidate" ? "Application #" + application.Id : "Candidate Application"}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      application.status === "Applied" ? "bg-blue-100 text-blue-800" :
                      application.status === "Reviewing" ? "bg-yellow-100 text-yellow-800" :
                      application.status === "Interview" ? "bg-purple-100 text-purple-800" :
                      application.status === "Offer" ? "bg-green-100 text-green-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {application.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Job ID: {application.jobId} • Applied: {new Date(application.appliedDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon="FileText"
              title="No recent applications"
              message={currentRole === "candidate" ? "Your job applications will appear here" : "New candidate applications will appear here"}
            />
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
            <button className="text-sm text-primary font-medium hover:underline">
              View All
            </button>
          </div>

          {dashboardData.recentTasks.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentTasks.map((task) => (
                <div key={task.Id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">{task.title_c}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status_c === "New" ? "bg-blue-100 text-blue-800" :
                      task.status_c === "In Progress" ? "bg-yellow-100 text-yellow-800" :
                      task.status_c === "Completed" ? "bg-green-100 text-green-800" :
                      task.status_c === "Blocked" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {task.status_c}
                    </span>
                  </div>
                  {task.due_date_c && (
                    <p className="text-sm text-gray-600">
                      Due: {new Date(task.due_date_c).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon="List"
              title="No recent tasks"
              message="Your tasks will appear here"
            />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary to-primary/90 rounded-lg p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">
          {currentRole === "candidate" ? "Ready to Apply?" : "Need to Post a Job?"}
        </h2>
        <p className="mb-4 opacity-90">
          {currentRole === "candidate" 
            ? "Discover thousands of job opportunities that match your skills and preferences."
            : "Find qualified candidates by posting your job opening to our platform."
          }
        </p>
        <button className="bg-white text-primary px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          {currentRole === "candidate" ? "Browse Jobs" : "Post New Job"}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;