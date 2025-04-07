#include <vector>
#include <iostream>
using namespace std;

// Helper function to parse input into a vector
vector<int> parseInput() {
    int n;
    cin >> n; // Read the size of the array
    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i]; // Read each number
    }
    int target;
    cin >> target; // Read the target
    return nums;
}

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        // Implement the logic to find two indices whose elements sum to target
        // Return a vector containing the two indices
        return {};
    }
};

int main() {
    // Read input
    vector<int> nums = parseInput();
    int target;
    cin >> target; // Read target (already handled by parseInput in this case)

    // Create solution instance and get result
    Solution solution;
    vector<int> result = solution.twoSum(nums, target);

    // Output result
    if (result.size() == 2) {
        cout << result[0] << " " << result[1] << endl;
    } else {
        cout << "No solution found" << endl;
    }

    return 0;
}