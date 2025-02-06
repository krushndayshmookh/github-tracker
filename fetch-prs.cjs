const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// Optionally, set your GitHub Personal Access Token as an environment variable for higher rate limits.
// E.g. in your shell: export GITHUB_TOKEN=your_token_here
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Replace with the GitHub usernames you want to search for.
const usernames = fs.readFileSync('data/usernames-gsoc.txt', 'utf8').split('\n').map(username => username.trim()).filter(Boolean);

// const lastUpdated = new Date(2025, 1, 6).toISOString(); // for adypu gsoc students
const lastUpdated = new Date(2020, 9, 9).toISOString(); // for all adypu students

const today = new Date().toISOString();

/**
 * Escapes a CSV value by wrapping it in quotes if necessary
 * and doubling any embedded quotes.
 */
function csvEscape(value) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}


/**
 * Fetches the merge status of a pull request using its API URL.
 *
 * @param {string} prApiUrl - The API URL for the pull request.
 * @returns {Promise<boolean>} - Resolves to true if the PR was merged, false otherwise.
 */
async function fetchMergeStatus(prApiUrl) {
  try {
    const response = await axios.get(prApiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
      }
    });
    // The response includes a 'merged' boolean (or you can check merged_at !== null)
    return response.data.merged;
  } catch (error) {
    console.error(`Error fetching merge status for PR at ${prApiUrl}:`, error.message);
    // In case of an error, assume the PR was not merged.
    return false;
  }
}

/**
 * For a given GitHub username, fetches all pull requests created by that user.
 * Uses the GitHub search API to query for issues that are pull requests (is:pr).
 *
 * @param {string} username - The GitHub username.
 * @returns {Promise<Array>} - An array of objects representing each PR.
 */
async function fetchPRsForUser(username) {
  let prRows = [];
  let page = 1;
  const per_page = 100; // maximum items per page
  while (true) {
    // Build the search query URL.
    // The query 'author:USERNAME is:pr' returns all pull requests created by USERNAME after the lastUpdated date.
    const searchUrl = `https://api.github.com/search/issues?q=author:${username}+is:pr+created:>=${lastUpdated}&per_page=${per_page}&page=${page}`;
    console.log(`Fetching PRs for ${username} (page ${page})`);
    try {
      const response = await axios.get(searchUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          // Include the token if provided
          ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
        }
      });

      const data = response.data;
      if (!data.items || data.items.length === 0) {
        break; // No more results
      }

      // Process each PR item.
      for (const item of data.items) {
        // The API returns a repository URL like: https://api.github.com/repos/owner/repo
        const repoUrl = item.repository_url;
        const parts = repoUrl.split('/');
        // Extract the repository owner (organization or user) and repository name.
        const owner = parts[parts.length - 2];
        const repo = parts[parts.length - 1];
        // Extract the PR details.
        const prLink = item.html_url;
        const prStatus = item.state; // 'open' or 'closed'
        const prDate = item.created_at; // Date the PR was created

        // Determine if the PR was merged.
        // The search API returns an object 'pull_request' with a URL for PR details.
        let prMerged = false;
        if (item.pull_request && item.pull_request.url) {
          prMerged = await fetchMergeStatus(item.pull_request.url);
        }

        prRows.push({
          username,    // the author queried
          owner,       // repository owner (org or user)
          repo,
          prLink,
          prStatus,
          prMerged,
          prDate
        });
      };

      // If we received less than the maximum per_page results, we’re done.
      if (data.items.length < per_page) {
        break;
      }
      page++;
    } catch (error) {
      console.error(`Error fetching PRs for ${username}:`, error.message);
      break;
    }
  }
  return prRows;
}

/**
 * Main function: loops through each username, fetches their PRs,
 * and writes the results to a CSV file.
 */
async function main() {
  let allRows = [];

  // Process each username sequentially.
  for (const username of usernames) {
    const prRows = await fetchPRsForUser(username);
    allRows.push(...prRows);
  }

  // Build CSV content.
  // CSV header: username, org/user, repo, PR link, PR status, PR date
  const header = ['username', 'org/user', 'repo', 'PR link', 'PR status', 'PR merged', 'PR date'];
  let csvContent = header.join(',') + '\n';

  allRows.forEach(row => {
    const line = [
      csvEscape(row.username),
      csvEscape(row.owner),
      csvEscape(row.repo),
      csvEscape(row.prLink),
      csvEscape(row.prStatus),
      csvEscape(row.prMerged),
      csvEscape(row.prDate)
    ].join(',');
    csvContent += line + '\n';
  });

  // Write the CSV to output.csv in the current directory.
  fs.writeFileSync(`data/output-${today}.csv`, csvContent, 'utf8');
  console.log(`CSV file created with ${allRows.length} PR entries.`);
}

// Start the program.
main();