import java.util.Scanner;

public class temp {
    public static void reverseArray(int[] arr) {
        
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }
        reverseArray(arr);
        for (int i = 0; i < n; i++) {
            System.out.print(arr[i] + (i < n - 1 ? " " : "\n"));
        }
        sc.close();
    }
}