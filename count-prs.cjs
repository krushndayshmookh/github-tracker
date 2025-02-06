const fs = require('fs');
const csv = require('csv-parser');

// This object will accumulate counts by the combination of username and organization.
// The key will be a concatenation of username and organization.
const countsByGroup = {};

// Read the CSV file produced by your earlier script (e.g., output.csv).
fs.createReadStream('data/gsoc-prs.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Extract relevant columns.
    // "username" is the GitHub username and "org/user" is the organization or repository owner.
    const username = row['username'].trim();
    const org = row['org/user'].trim();

    // Create a unique key for each username + org combination.
    const key = `${username}::${org}`;

    // Initialize counts for this group if not already done.
    if (!countsByGroup[key]) {
      countsByGroup[key] = {
        username,
        org,
        total: 0,
        open: 0,
        merged: 0,
        closed: 0
      };
    }

    // Increment the total PR count.
    countsByGroup[key].total++;

    // Determine PR status.
    // "PR status" should be "open" or "closed" and "PR merged" is expected to be "true" or "false".
    const prStatus = row['PR status'].trim().toLowerCase();
    const prMerged = row['PR merged'].trim().toLowerCase();

    if (prStatus === 'open') {
      countsByGroup[key].open++;
    } else if (prMerged === 'true') {
      // Closed and merged PRs.
      countsByGroup[key].merged++;
    } else {
      // Closed and not merged.
      countsByGroup[key].closed++;
    }
  })
  .on('end', () => {
    // Build CSV content with header: username, org, total, open, merged, closed
    let csvContent = 'username,org,open,merged,closed,total,\n';

    // Loop over each group and create a row in the summary CSV.
    for (const key in countsByGroup) {
      const group = countsByGroup[key];
      csvContent += `${group.username},${group.org},${group.open},${group.merged},${group.closed},${group.total}\n`;
    }

    // Write the summary CSV file.
    fs.writeFileSync('data/gsoc-summary.csv', csvContent, 'utf8');
    console.log('Summary CSV file created as summary.csv');
  })
  .on('error', (err) => {
    console.error('Error reading the CSV file:', err);
  });