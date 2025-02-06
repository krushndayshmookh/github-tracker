# GitHub PR Tracker

A Node.js-based tool to track and analyze GitHub pull requests for specified users. This tool is particularly useful for monitoring contributions and generating reports about PR activity.

## Features

- Fetch all pull requests for specified GitHub users
- Track PR status (open, closed, merged)
- Generate detailed CSV reports
- Summarize PR statistics by user and organization
- Support for authentication using GitHub Personal Access Token

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm (comes with Node.js)
- GitHub Personal Access Token (optional, but recommended for higher rate limits)

## Installation

1. Clone this repository

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add your GitHub token (optional):

    ```
    GITHUB_TOKEN=your_github_token_here
    ```

## Project Structure

- `fetch-prs.cjs` - Main script to fetch pull requests for specified users
- `count-prs.cjs` - Script to generate PR statistics and summaries
- `data/` - Directory containing input files and generated reports
  - `usernames-gsoc.txt` - Input file containing GitHub usernames to track
  - Output files will be generated here

## Usage

### 1. Fetching Pull Requests

1. Add GitHub usernames to track in `data/usernames-gsoc.txt` (one username per line)

2. Run the fetch script:

    ```bash
    node fetch-prs.cjs
    ```

This will generate a CSV file in the `data` directory with details of all pull requests.

### 2. Generating Statistics

To generate a summary of PR statistics:

```bash
node count-prs.cjs
```

This will create a summary CSV file with PR counts by user and organization.

## Output Format

### PR Details CSV (`output-{date}.csv`)

- username
- org/user
- repo
- PR link
- PR status
- PR merged
- PR date

### Summary CSV (`gsoc-summary.csv`)

- username
- org
- open PRs
- merged PRs
- closed PRs
- total PRs

## Dependencies

- axios: For making HTTP requests to GitHub API
- csv-parser: For processing CSV files
- dotenv: For managing environment variables

## Notes

- The GitHub API has rate limits. Using a Personal Access Token is recommended for higher limits.
- The tool respects GitHub's API rate limits and includes error handling.
- Large numbers of users or PRs may take longer to process due to API pagination.

## License

This project is open source and available under the MIT License.
