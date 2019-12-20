//------------------------------------------------
// !!!!! vvvvv vvvvv vvvvv vvvvv vvvvv vvvvv vvvvv
//
// TODO(sandello): Модель документа.
//
// Документ (строку) будем моделировать как пару множеств:
//
//   D1 = { (position, symbol) } -- множество пар (позиция, символ);
//   D2 = { position } -- множество удаленных позиций.
//
// Адресация в документе будет строиться по индексам и по позициям.
//
// Индекс -- число -- в классическом понимании идентифицирует символ в строке.
// Индекс меняется от 0 до длины документа минус один.
//
// Позиция -- путь в дереве аллоцированных позиций от корня до листа.
// Позиция кодируется списком индексов потомков на пути от корня до листа.
//
// Пусть A -- арность каждого узла в дереве, например 100. Тогда:
//
//   [0] -- начало строки.
//   [100] -- конец строки (A).
//   [0,14] -- идем к "началу строки", далее к 14-му потомку.
//   [82,11] -- идем к потомку под номером 82, далее к 11-му потомку.

// === Публичный интерфейс.

// Конструктор.
//
// Инициализирует необходимые структуры данных.
// Результат работы конструктора передается далее во все функции первым аргументом.
function public_newDocument() {
    return {
        D1: new Map([[JSON.stringify([0]), "begin"], [JSON.stringify([100]), "end"]]),
        D2: new Set()
    };
}

var ind_to_pos;
function updateLocalDocument(newContent, localDocument) {
    var docContent = public_getContent(localDocument);
    var changes = editList(docContent, newContent);
    ind_to_pos = _getPositionByIndex(localDocument).slice();
    console.log(changes);
    console.log(ind_to_pos);
    for (let i of changes) {
        switch (i[0]) {
            case "X" :
                public_replace(localDocument, i[1], i[2]);
                break;
            case "I" : {
                public_insertAfter(localDocument, i[1], i[2]);
                break;
            }
            case "D" : {
                public_remove(localDocument, i[1]);
                break;
            }
        }
    }
}

function assertEquals(left, right) {
    if (left !== right) {
        throw new Error("Ошибка: [" + left + "] != [" + right + "]");
    }
}

// Вернуть содержимое документа.
//
// Если документ представлен как множество пар (позиция, символ) плюс множество удаленных позиций,
// то нужно проитерироваться по всем неудаленным позициям в возрастающем порядке и склеить символы.
function public_getContent(document) {
    var a = [];
    for (let x of document.D1) {
        if (!document.D2.has(x[0])) {
            a.push([JSON.parse(x[0]), x[1]]);
        }
    }
    a.sort(cmp);
    var s = "";
    a.forEach(function (x) {
        if (x[1] != "begin" && x[1] != "end")
            s += x[1];
    });
    return s;
}


function public_mergeStateWith(document, serializedState) {
    var newState = JSON.parse(serializedState);
    newState[0].forEach(function (x) {
        document.D1.set(x[0], x[1]);
    });
    newState[1].forEach(function (x) {
        document.D2.add(x);
    });
}

function public_serializeState(document) {
    var serializedD1 = [];
    var serializedD2 = [];
    for (let x of document.D1) {
        serializedD1.push([x[0], x[1]]);
    }
    document.D2.forEach(function (x) {
        serializedD2.push(x);
    });
    return JSON.stringify([serializedD1, serializedD2]);
}

// Функция, которая обновляет состояние документа с новым сериализованным состоянием.

// Функция, которая моделирует добавление символа по индексу.
function public_insertAfter(document, index, symbol) {
    var z = _allocate(document, ind_to_pos[index + 1], ind_to_pos[index + 2]);
    _applyInsert(document, z, symbol);
}

// Функция, которая моделирует удаление символа по индексу.
function public_remove(document, index) {
    _applyRemove(document, ind_to_pos[index + 1]);
}

// Функция, которая моделирует замену символа по индексу.
function public_replace(document, index, symbol) {
    public_remove(document, index);
    public_insertAfter(document, index - 1, symbol);
}

// === Приватный интерфейс.
//
// Нам важно уметь преобразовывать индексы в позиции и наоборот.
//
// Реализовать функцию, вычисляющую позицию символа по индексу.
//
// Если index находится в диапазоне [0; N-1] (N -- длина строки),
// то возвращаемая позиция кодирует некоторый узел в дереве.
// Если index равен -1 -- начало строки -- то возвращаемая позиция должна быть [0].
// Если index равен N -- конец строки -- то возвращаемая позиция должна быть [100].
function _getPositionByIndex(document) {
    var a = [];
    for (var x of document.D1) {
        if (!document.D2.has(x[0]))
            a.push(JSON.parse(x[0]));
    }
    a.sort(cmp);
    return a;
}

function cmp (a, b) {
    if (b === undefined || a === undefined)
        debugger;
    for (let i = 0; i < Math.min(a.length, b.length); ++i) {
        if (a[i] < b[i])
            return -1;
        if (a[i] > b[i])
            return 1;
    }
    if (a.length === b.length)
        return 0;

    if (a.length < b.length)
        return -1;
    else
        return 1;
}

const magicK = 50;
const levelSize = 100;
const maxLevel = 200;
// Реализовать функцию, аллоцирующую новую позицию между двумя границами.
//
// Стратегии аллокации между двумя вершинами могут быть разные.
// Важно аллоцировать не слишком "плотно" новые идентификаторы,
// чтобы обслуживать будущие аллокации без изменения структуры дерева.
//
// Пример (здесь "<" значит "предшествует"; K = 10):
//   begin = [4, 52]
//   если позиции с [4, 52] до [4, 62] свободны, то
//   можно аллоцировать [4, 62], так как [4, 52] < [4, 62];
//   begin = [8, 93]
//   можно аллоцировать [8, 93, 10], так как [8, 93] < [8, 93, 10];
//
// Можно следовать стратегии "аллоцировать ближе к правому краю".
// Логика схожая, только отталкиваемся от end и шагаем влево.
// Такая стратегия будет походить для небольших правок в середине текста.
//
// Пример (здесь "<" значит "предшествует"; K = 10):
//   end = [8, 90]
//   если позиции с [8, 80] до [8, 90] свободны, то
//   можно аллоцировать [8, 80];
//   end = [8, 90]
//   если позиция [8, 89] занята,
//   то можно аллоцировать [8, 89, 90];
//
// Лучше всего -- подбрасывать монетку и выбирать случайно одну из двух стратегий выше.
// Таким образом мы будем маскировать незнание паттерна правок в документе.

function _allocate(document, begin, end) {
    if (Math.random() <= 0.5) {
        return _allocateLeft(document, begin, end);
    } else {
        return _allocateRight(document, begin, end);
    }
}


function _allocateLeft(document, begin, end) {
    var cur = begin.slice();
    var fix = begin.slice(0, -1);
    var poses = [];
    if (cur.length > maxLevel)
        return cur;
    for (let i = cur[cur.length - 1]; i < Math.min(magicK + cur[cur.length - 1], levelSize); ++i) {
        fix.push(i);
        var sfix = JSON.stringify(fix);
        if (!document.D1.has(sfix) && cmp(begin, fix) === -1 && cmp(fix, end) === -1) {
            poses.push(fix.slice());
        }
        fix.pop();
    }
    if (poses.length !== 0) {
        return poses[Math.floor(Math.random() * (poses.length - 1))];
    }
    else {
        cur = cur.slice(0, -1);
        if (cur.length + 1 === begin.length) {
            cur.push(begin[cur.length]);
        }
        cur.push(0);
        return _allocateLeft(document, cur, end);
    }
}

function _allocateRight(document, begin, end) {
    var cur = end.slice();
    var fix = end.slice(0, -1);
    var poses = [];
    if (cur.length > maxLevel)
        return cur;
    for (let i = cur[cur.length - 1]; i >= Math.max(0 ,-magicK + cur[cur.length - 1]); --i) {
        fix.push(i);
        var sfix = JSON.stringify(fix);
        if (!document.D1.has(sfix) && cmp(begin, fix) === -1 && cmp(fix, end) === -1) {
            poses.push(fix.slice());
        }
        fix.pop();
    }
    if (poses.length !== 0) {
        return poses[Math.floor(Math.random() * (poses.length - 1))];
    }
    else {
        cur = cur.slice(0, -1);
        if (cur.length + 1 === end.length) {
            cur.push(end[cur.length] - 1);
        }
        cur.push(levelSize);
        return _allocateRight(document, begin, cur);
    }
}

//ACCEPTED Применяем операцию добавления символа symbol в позицию (не индекс!) position.
function _applyInsert(document, position, symbol) {
    // нужно обновить D1, сохранив нужную пару
    var fix = JSON.stringify(position);
    document.D1.set(fix, symbol);
}

//ACCEPTED Применяем операцию удаления символа в позиции position.
function _applyRemove(document, position) {
    // нужно обновить D2, сохранив удаленную позицию
    var fix = JSON.stringify(position)
    document.D2.add(fix);
}
