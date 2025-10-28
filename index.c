// #include <stdio.h>
// #include <pthread.h>

// #define N 10 // 1 dan 10 gacha sonlar uchun

// void *print_even(void *arg)
// {
//       printf("Juft sonlar: ");
//       for (int i = 1; i <= N; ++i)
//       {
//             if (i % 2 == 0)
//             {
//                   printf("%d ", i);
//             }
//       }
//       printf("\n");
//       return NULL;
// }

// void *print_odd(void *arg)
// {
//       printf("Toq sonlar: ");
//       for (int i = 1; i <= N; ++i)
//       {
//             if (i % 2 != 0)
//             {
//                   printf("%d ", i);
//             }
//       }
//       printf("\n");
//       return NULL;
// }

// int main(void)
// {
//       pthread_t even_thread, odd_thread;

//       // Har bir oqimni yaratamiz
//       pthread_create(&even_thread, NULL, print_even, NULL);
//       pthread_create(&odd_thread, NULL, print_odd, NULL);

//       // Har ikkisini tugaguncha kutamiz
//       pthread_join(even_thread, NULL);
//       pthread_join(odd_thread, NULL);

//       printf("Dastur tugadi.\n");
//       return 0;
// }

// first
// char str[100];
// printf("Enter your name: ");
// fgets(str, sizeof(str), stdin);

// int length = strlen(str);
// printf("Length: %d\n", length - 1);

// return 0;

// second
// #include <stdio.h>
// #include <stdlib.h>
// #include <string.h>
// int main(void)
// {
//       char input[100];

//       printf("Satrni kiriting: ");
//       fgets(input, sizeof(input), stdin);
//       input[strcspn(input, "\n")] = '\0';

//       char *copy = (char *)malloc(strlen(input) + 1);

//       if (copy == NULL)
//       {
//             printf("Xotira ajratishda xatolik!\n");
//             return 1;
//       }

//       strcpy(copy, input);

//       printf("Kiritilgan satr: %s\n", input);
//       printf("Nusxa: %s\n", copy);

//       free(copy);
//       return 0;
// }