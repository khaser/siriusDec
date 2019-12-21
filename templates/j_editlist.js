//------------------------------------------------
// !!!!! vvvvv vvvvv vvvvv vvvvv vvvvv vvvvv vvvvv
//
// TODO(sandello): Правки по Левенштейну.
//
// Необходимо реализовать алгоритм расчета расстояния Левенштейна
// между строками left и right и вернуть "список правок",
// как получить из левой строки -- правую.
//
// На входе -- две строки.
// На выходе -- массив правок вида:
// [
//   ["I", 0, "a"], // вставка
//   ["D", 3],      // удаление
//   ["X", 4, "b"], // замена
// ]
//
// Пример:
//   * editList("cat", "cats") = [ ["I", 3, "s"] ]
//   * editList("cat", "cuts") = [ ["X", 1, "u"], ["I", 3, "s"] ]
//   * editList("cat", "at")   = [ ["D", 0 ] ]
//   * editList("", "hi")      = [ ["I", 0, "h"], ["I", 1, "i"] ]
//
// Подсказки:
//   1. Для ассоциативной структуры данных с численными ключами можно использовать JS-объекты:
//        var a = {}; a[5] = 0;
//      При этом элементы, к которым не было обращений -- не инициализированы.
//        var a = {}; a[8] === undefined;
//      Проверка наличия ключа может быть устроена так:
//        var a = {}; if (a[8] === undefined) { /* нет ключа */ } else { /* есть ключ */ }
//   2. Для ассоциативной структуры с произвольным ключами можно использовать Map.
//      https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Map

function editList(left, right) {
    var inf = 10 ** 9;
    var n = left.length, m = right.length;

    var dp = [];
    var res = [];
    for (let i = 0; i <= n; ++i) {
        var tmp = [];
        var tmp2 = [];
        for (let j = 0; j <= m; ++j) {
            tmp.push(inf);
            tmp2.push([-inf, -inf])
        }
        res.push(tmp2);
        dp.push(tmp);
    }
    dp[0][0] = 0;
    for (let i = 0; i <= n; ++i) {
        for (let j = 0; j <= m; ++j) {
            if (i != 0) {
                if (dp[i][j] > dp[i - 1][j] + 1) {
                    dp[i][j] = Math.min(dp[i][j], dp[i - 1][j] + 1);
                    res[i][j] = [[i - 1, j], ['D', i - 1]];
                }
            }
            if (j != 0) {
                if (dp[i][j] > dp[i][j - 1] + 1) {
                    dp[i][j] = Math.min(dp[i][j], dp[i][j - 1] + 1);
                    res[i][j] = [[i, j - 1], ['I', j - 2, right[j - 1]]];
                }
            }
            if (j != 0 && i != 0) {
                if (dp[i][j] > dp[i - 1][j - 1] + 1) {
                    dp[i][j] = Math.min(dp[i][j], dp[i - 1][j - 1] + 1);
                    res[i][j] = [[i - 1, j - 1], ['X', j - 1, right[i - 1]]];
                }
                if (left[i - 1] == right[j - 1]) {
                    if (dp[i][j] > dp[i - 1][j - 1]) {
                        res[i][j] = [[i - 1, j - 1], []];
                    }
                    dp[i][j] = Math.min(dp[i][j], dp[i - 1][j - 1]);
                }
            }
        }
    }
    cur = [n, m];
    var ans = [];
    while (cur != -inf) {
        if (typeof(res[cur[0]][cur[1]][1]) == "object" && res[cur[0]][cur[1]][1].length > 1)
            ans.push(res[cur[0]][cur[1]][1]);
        cur = res[cur[0]][cur[1]][0];
    }
    ans.sort(cmp);
    return ans;
}

// !!!!! ^^^^^ ^^^^^ ^^^^^ ^^^^^ ^^^^^ ^^^^^ ^^^^^
//------------------------------------------------

