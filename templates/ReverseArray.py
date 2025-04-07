def reverse_array(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1

# Read input
n = int(input())
arr = list(map(int, input().split()))

# Reverse and print
reverse_array(arr)
print(" ".join(map(str, arr)))