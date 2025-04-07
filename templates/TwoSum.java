import java.util.*;

public class temp {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int n = scanner.nextInt(); // Read size of array
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = scanner.nextInt(); // Read each element
        }
        int target = scanner.nextInt(); // Read target

        temp solution = new temp();
        int[] result = solution.twoSum(nums, target);

        if (result.length == 2) {
            System.out.println("[" + result[0] + ", " + result[1] + "]");
        } else {
            System.out.println("No solution found");
        }

        scanner.close();
    }
}
